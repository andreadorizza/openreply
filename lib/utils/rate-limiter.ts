/**
 * Rate Limiter
 *
 * Redis-based rate limiter for Instagram private replies.
 *
 * The cap matches Meta's documented limit for this exact call: 750 private
 * replies per hour per Instagram professional account, for comments on posts
 * and reels. Exceeding it risks 429s and app-level restrictions, so the worker
 * requeues rather than pushing through.
 * https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
 *
 * Note this is a hard ceiling with no headroom. If Meta throttles before the
 * documented limit, or other calls on the same account share the bucket, lower
 * this value.
 */

import Redis from "ioredis";

const RATE_LIMIT_MAX = 750; // private replies per hour, per Meta's documented cap
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const REQUEUE_DELAY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_REQUEUE_ATTEMPTS = 3;
// How long an account stops sending after Meta itself refuses a send as rate
// limited. Meta gives no retry-after, and a throttled account that keeps
// sending stays throttled: on a busy post every queued comment then fails in
// turn instead of waiting for the window to clear.
const META_PAUSE_MS = 15 * 60 * 1000;
// Jobs held by a pause resume spread over this window, not all at once.
const META_PAUSE_JITTER_MS = 2 * 60 * 1000;

// Optional pacing (COMMENT_DM_MAX_PER_HOUR). Instagram can refuse every new
// conversation from an account long before Meta's documented cap: one account
// was blocked for hours, twice, at about 150 private replies an hour. Pacing
// gives each comment DM its own time slot, evenly spaced, and comments over the
// rate wait in the queue for theirs instead of being dropped.
//
// A paced hold is a scheduled slot, not a failed try, and a long Instagram block
// re-holds every queued comment once per pause, so the requeue budget is larger.
const MAX_PACED_REQUEUE_ATTEMPTS = 48;
// Never schedule further out than this; the comment is skipped instead. A DM a
// day late is already a poor answer, and Instagram stops allowing a private
// reply 7 days after the comment.
const MAX_PACED_HOLD_MS = 24 * 60 * 60 * 1000;
// How far a job may run before or after its slot and still own it.
const SLOT_EARLY_MS = 1000;
const SLOT_LATE_MS = 60 * 1000;

// Account-wide block. Meta answers a private reply with code 100, subcode
// 2534001 ("the thread owner has archived or deleted this conversation") both
// when one commenter has closed their DMs and when Instagram refuses every new
// conversation from the account. A few of them from different commenters in a
// short window means the second.
const THREAD_REFUSAL_WINDOW_MS = 10 * 60 * 1000;
const THREAD_REFUSAL_BURST = 3;
// Pause for a block. Sending into it does not end it: the last block lifted
// about half an hour after the retries stopped.
const ACCOUNT_BLOCK_PAUSE_MS = 30 * 60 * 1000;
// While a block is remembered, a single refusal counts as the block still
// being on. A delivered comment DM clears it.
const ACCOUNT_BLOCK_MEMORY_MS = 6 * 60 * 60 * 1000;

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null, // required by BullMQ
    });
  }
  return redis;
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remainingDMs: number;
  shouldRequeue: boolean;
  requeueDelayMs: number;
  shouldSkip: boolean;
  reserved: boolean;
  // Pacing only: the time (ms since epoch) of the slot this hold reserved. The
  // job carries it back, and a job that arrives at its slot sends right away.
  slotAt?: number;
}

/**
 * Minimum gap between comment DMs for one account, from COMMENT_DM_MAX_PER_HOUR.
 * 0 when unset, which keeps sending as fast as the hourly cap allows.
 */
export function commentDmIntervalMs(): number {
  const perHour = Number(process.env.COMMENT_DM_MAX_PER_HOUR ?? "");
  if (!Number.isFinite(perHour) || perHour <= 0) return 0;
  return Math.ceil(3_600_000 / Math.min(perHour, RATE_LIMIT_MAX));
}

// With pacing on, KEYS[3] holds when the account's next send slot is free.
// A job outside a pause that arrives at its own slot (ARGV[4]) sends without
// queueing again; any other job takes the next free slot, which during a pause
// is after the pause, so held jobs come back spaced out rather than at once.
const RESERVE_DM_SLOT_SCRIPT = `
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local max = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local interval = tonumber(ARGV[3])
local slot_at = tonumber(ARGV[4])
local now = tonumber(ARGV[5])
local max_hold = tonumber(ARGV[6])
local early = tonumber(ARGV[7])
local late = tonumber(ARGV[8])

local paused_ms = tonumber(redis.call("PTTL", KEYS[2]))
if paused_ms < 0 then
  paused_ms = 0
end

if interval > 0 then
  local owns_slot = paused_ms == 0 and slot_at > 0 and
    slot_at <= now + early and slot_at >= now - late
  if not owns_slot then
    local free_at = tonumber(redis.call("GET", KEYS[3]) or "0")
    if free_at < now + paused_ms then
      free_at = now + paused_ms
    end
    if free_at > now then
      local wait = free_at - now
      if wait > max_hold then
        return {0, current, 0, paused_ms, -1, 0}
      end
      redis.call("SET", KEYS[3], free_at + interval, "PX", wait + interval)
      return {0, current, 0, paused_ms, wait, free_at}
    end
    redis.call("SET", KEYS[3], now + interval, "PX", interval)
  end
elseif paused_ms > 0 then
  return {0, current, 0, paused_ms}
end

if current >= max then
  return {0, current, 0}
end

local next_count = redis.call("INCR", KEYS[1])
if next_count == 1 then
  redis.call("EXPIRE", KEYS[1], ttl)
end

return {1, next_count, max - next_count}
`;

function toScriptNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseInt(value, 10);
  return 0;
}

function blockedResult(
  count: number,
  requeueAttempt: number,
  requeueDelayMs: number = REQUEUE_DELAY_MS,
  maxRequeueAttempts: number = MAX_REQUEUE_ATTEMPTS,
  slotAt?: number
): RateLimitResult {
  if (requeueAttempt >= maxRequeueAttempts) {
    return {
      allowed: false,
      currentCount: count,
      remainingDMs: 0,
      shouldRequeue: false,
      requeueDelayMs: 0,
      shouldSkip: true,
      reserved: false,
    };
  }

  return {
    allowed: false,
    currentCount: count,
    remainingDMs: 0,
    shouldRequeue: true,
    requeueDelayMs,
    shouldSkip: false,
    reserved: false,
    ...(slotAt ? { slotAt } : {}),
  };
}

function pauseKey(instagramAccountId: string): string {
  return `rate:dm:pause:${instagramAccountId}`;
}

function nextSlotKey(instagramAccountId: string): string {
  return `rate:dm:next:${instagramAccountId}`;
}

function threadRefusalsKey(instagramAccountId: string): string {
  return `rate:dm:refused:${instagramAccountId}`;
}

function accountBlockKey(instagramAccountId: string): string {
  return `rate:dm:blocked:${instagramAccountId}`;
}

// Never shortens a pause already running: a 15-minute rate-limit pause must not
// cut a 30-minute block pause short.
const EXTEND_PAUSE_SCRIPT = `
local remaining = tonumber(redis.call("PTTL", KEYS[1]))
if remaining < tonumber(ARGV[1]) then
  redis.call("SET", KEYS[1], "1", "PX", ARGV[1])
  return 1
end
return 0
`;

/**
 * Stop sending from an account for a while because Meta rate limited it, or
 * because Instagram is refusing new conversations from it.
 *
 * Every reserveDMSlot call for the account is refused until the pause ends,
 * and the job is requeued for when it does, so nothing reaches Meta in the
 * meantime. A later refusal extends the pause from that moment; a shorter one
 * never cuts a running pause short.
 */
export async function pauseDMSends(
  instagramAccountId: string,
  pauseMs: number = META_PAUSE_MS
): Promise<void> {
  await getRedis().eval(EXTEND_PAUSE_SCRIPT, 1, pauseKey(instagramAccountId), pauseMs);
}

const RECORD_THREAD_REFUSAL_SCRIPT = `
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
redis.call("ZADD", KEYS[1], now, ARGV[5])
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now - window)
redis.call("PEXPIRE", KEYS[1], window)
if redis.call("EXISTS", KEYS[2]) == 1 or
   redis.call("ZCARD", KEYS[1]) >= tonumber(ARGV[3]) then
  redis.call("SET", KEYS[2], "1", "PX", ARGV[4])
  return 1
end
return 0
`;

/**
 * Record a "thread owner has archived or deleted this conversation" refusal
 * and report whether it is part of an account-wide block: a burst from several
 * different commenters, or any refusal while an earlier block is remembered.
 */
export async function recordThreadRefusal(
  instagramAccountId: string,
  commenterId: string
): Promise<boolean> {
  const result = await getRedis().eval(
    RECORD_THREAD_REFUSAL_SCRIPT,
    2,
    threadRefusalsKey(instagramAccountId),
    accountBlockKey(instagramAccountId),
    Date.now(),
    THREAD_REFUSAL_WINDOW_MS,
    THREAD_REFUSAL_BURST,
    ACCOUNT_BLOCK_MEMORY_MS,
    commenterId
  );
  return toScriptNumber(result) === 1;
}

/**
 * A comment DM was delivered, so any block is over: forget it, and start the
 * refusal count again so one refusal right after cannot look like a burst.
 */
export async function clearAccountBlock(instagramAccountId: string): Promise<void> {
  await getRedis().del(
    accountBlockKey(instagramAccountId),
    threadRefusalsKey(instagramAccountId)
  );
}

/**
 * Check if an Instagram account is within its DM rate limit.
 *
 * Uses a Redis counter with a 1-hour TTL per account.
 * Key pattern: `rate:dm:{instagramAccountId}`
 *
 * @param instagramAccountId - The Instagram account ID to check
 * @param requeueAttempt - How many times this job has been requeued (0 = first attempt)
 * @returns Rate limit result with action recommendations
 */
export async function checkRateLimit(
  instagramAccountId: string,
  requeueAttempt: number = 0
): Promise<RateLimitResult> {
  const client = getRedis();
  const key = `rate:dm:${instagramAccountId}`;

  const currentCount = await client.get(key);
  const count = currentCount ? parseInt(currentCount, 10) : 0;

  if (count >= RATE_LIMIT_MAX) {
    // Over the limit
    if (requeueAttempt >= MAX_REQUEUE_ATTEMPTS) {
      // Exceeded max requeue attempts — skip this DM
      return {
        allowed: false,
        currentCount: count,
        remainingDMs: 0,
        shouldRequeue: false,
        requeueDelayMs: 0,
        shouldSkip: true,
        reserved: false,
      };
    }

    return {
      allowed: false,
      currentCount: count,
      remainingDMs: 0,
      shouldRequeue: true,
      requeueDelayMs: REQUEUE_DELAY_MS,
      shouldSkip: false,
      reserved: false,
    };
  }

  return {
    allowed: true,
    currentCount: count,
    remainingDMs: RATE_LIMIT_MAX - count,
    shouldRequeue: false,
    requeueDelayMs: 0,
    shouldSkip: false,
    reserved: false,
  };
}

/**
 * Atomically reserve a DM send slot for an Instagram account.
 * This is the worker-safe path; it prevents concurrent jobs from all passing
 * the rate-limit check before any of them increments the Redis counter.
 */
export async function reserveDMSlot(
  instagramAccountId: string,
  requeueAttempt: number = 0,
  slotAt: number = 0
): Promise<RateLimitResult> {
  const client = getRedis();
  const key = `rate:dm:${instagramAccountId}`;

  const result = await client.eval(
    RESERVE_DM_SLOT_SCRIPT,
    3,
    key,
    pauseKey(instagramAccountId),
    nextSlotKey(instagramAccountId),
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW,
    commentDmIntervalMs(),
    slotAt,
    Date.now(),
    MAX_PACED_HOLD_MS,
    SLOT_EARLY_MS,
    SLOT_LATE_MS
  );
  const values = Array.isArray(result) ? result : [];
  const allowedFlag = toScriptNumber(values[0]);
  const count = toScriptNumber(values[1]);
  const remaining = toScriptNumber(values[2]);
  const pausedMs = toScriptNumber(values[3]);

  if (allowedFlag !== 1 && values.length > 4) {
    const holdMs = toScriptNumber(values[4]);
    // The schedule is already a day deep: skip rather than queue further out.
    if (holdMs < 0) {
      return {
        allowed: false,
        currentCount: count,
        remainingDMs: 0,
        shouldRequeue: false,
        requeueDelayMs: 0,
        shouldSkip: true,
        reserved: false,
      };
    }
    return blockedResult(
      count,
      requeueAttempt,
      holdMs,
      MAX_PACED_REQUEUE_ATTEMPTS,
      toScriptNumber(values[5])
    );
  }

  if (allowedFlag !== 1) {
    return pausedMs > 0
      ? blockedResult(
          count,
          requeueAttempt,
          pausedMs + Math.floor(Math.random() * META_PAUSE_JITTER_MS)
        )
      : blockedResult(count, requeueAttempt);
  }

  return {
    allowed: true,
    currentCount: count,
    remainingDMs: remaining,
    shouldRequeue: false,
    requeueDelayMs: 0,
    shouldSkip: false,
    reserved: true,
  };
}

/**
 * Release a DM slot previously taken by reserveDMSlot.
 *
 * reserveDMSlot increments the hourly counter before the send, so concurrent
 * jobs can't all pass the check at once. When that send then fails (closed
 * messaging window, expired token, rejected reply) the reserved slot is never
 * used and must be handed back. Otherwise a comment that never delivers a DM
 * still burns one slot per attempt, and BullMQ's retries burn several. On a
 * post with many failing sends the counter inflates past the real number of
 * DMs and legitimate replies get skipped as rate-limited until the TTL expires.
 *
 * DECR is atomic and preserves the key's TTL, so the hourly window still resets
 * when it originally would. A missing key (the window already rolled over)
 * would decrement to -1 with no expiry, so that case is clamped back to zero.
 */
export async function releaseDMSlot(
  instagramAccountId: string
): Promise<number> {
  const client = getRedis();
  const key = `rate:dm:${instagramAccountId}`;
  const next = await client.decr(key);
  if (next < 0) {
    await client.del(key);
    return 0;
  }
  return next;
}

/**
 * Backwards-compatible helper for tests and admin scripts.
 * Prefer reserveDMSlot in workers.
 */
export async function incrementDMCounter(
  instagramAccountId: string
): Promise<number> {
  const result = await reserveDMSlot(instagramAccountId, MAX_REQUEUE_ATTEMPTS);
  return result.currentCount;
}

/**
 * Get the current DM count for an Instagram account.
 */
export async function getCurrentDMCount(
  instagramAccountId: string
): Promise<number> {
  const client = getRedis();
  const key = `rate:dm:${instagramAccountId}`;
  const count = await client.get(key);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Reset the rate limiter for an account (useful for testing).
 */
export async function resetRateLimit(
  instagramAccountId: string
): Promise<void> {
  const client = getRedis();
  const key = `rate:dm:${instagramAccountId}`;
  await client.del(key);
}

// Export constants for use in tests
export {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW,
  REQUEUE_DELAY_MS,
  MAX_REQUEUE_ATTEMPTS,
  META_PAUSE_MS,
  META_PAUSE_JITTER_MS,
  MAX_PACED_REQUEUE_ATTEMPTS,
  MAX_PACED_HOLD_MS,
  THREAD_REFUSAL_WINDOW_MS,
  THREAD_REFUSAL_BURST,
  ACCOUNT_BLOCK_PAUSE_MS,
  ACCOUNT_BLOCK_MEMORY_MS,
};
