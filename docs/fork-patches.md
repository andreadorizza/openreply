# Fork patches

This repository is a fork of [diwenne/openreply](https://github.com/diwenne/openreply). It carries a few changes that upstream does not have. Each one is listed here with the reason, the code it touches, and the upstream change that would make it unnecessary.

Every fork patch is temporary. When upstream ships a fix for the same problem, the fork drops its own code and uses upstream's fix, even if the fork's version is more complete. If upstream fixes only part of the problem, the fork keeps only the part upstream does not cover, built on upstream's structure.

Last checked against upstream `c78b2d2` and upstream's open pull requests on 2026-11-12.

## How to use this file

When you sync with upstream (merge `upstream/main`):

1. For each patch below, compare its **Remove when** condition with the upstream commits you are merging. Also check whether the upstream pull requests named under **Upstream status** were merged.
2. If upstream now covers a patch, delete the fork code, its tests and its docs in the sync, and delete its entry here. List what you removed in the sync pull request.
3. If upstream covers part of a patch, or changes the same code without covering it, keep upstream's structure, keep only the fork behaviour upstream lacks, and update the entry.
4. Update the "Last checked" line above.

When you add fork-only code, add an entry here in the same pull request. `git diff --stat upstream/main` should list only files that belong to an entry here.

## 1. Pace comment DMs and hold them through an Instagram account block

Pull request andreadorizza/openreply#7: commits `415fb7a`, `8db470e` and `6e2269c`.

**Why.** On 10 and 11 November 2026, Instagram refused every new conversation from one account (code 100, subcode 2534001, "the thread owner has archived or deleted this conversation"). The first block came at about 134 comment DMs an hour, far below the 750 private replies an hour that Meta documents. The second came at only 85 in the hour, but after about 960 in 12 hours. Upstream treats each refusal as final, so about 500 comments got no DM during the blocks and had to be re-sent by hand.

**What the fork does.**

- `COMMENT_DM_MAX_PER_HOUR`, off by default, gives each comment DM its own evenly spaced send slot per account in Redis. A comment over the rate waits in the queue for its slot, for up to a day, instead of being sent at once. Production uses `90`.
- Three or more 2534001 refusals from different commenters within 10 minutes count as an account-wide block. Comment DMs pause for 30 minutes, and the refused comment is held instead of failed. For 6 hours afterwards a single refusal pauses again. Three deliveries in a row clear the block.
- `pauseDMSends` only extends a pause, so a shorter rate-limit pause cannot cut a block pause short.

**Code.**

- `lib/utils/rate-limiter.ts`: `commentDmIntervalMs`, the slot logic in `reserveDMSlot`, `recordThreadRefusal`, `recordDelivery`, `releaseHeldSlot`, the Lua scripts they run, and the `SLOT_*`, `MAX_HELD_REQUEUE_ATTEMPTS`, `MAX_PACED_HOLD_MS`, `THREAD_REFUSAL_*`, `ACCOUNT_BLOCK_*` and `DELIVERIES_TO_CLEAR_BLOCK` constants.
- `lib/queue/dm-worker.ts`: `isThreadRefusal`, `holdComment` and the account-block path.
- `lib/queue/client.ts`: `slotAt` on `ProcessCommentJob`.
- `docs/setup.md`: the `COMMENT_DM_MAX_PER_HOUR` table and the paragraph after it.
- Tests: `__tests__/rate-limiter.test.ts`, `__tests__/rate-limiter-redis.test.ts` (runs only when `TEST_REDIS_URL` is set) and the pacing and hold cases in `__tests__/dm-worker.test.ts`.

**Upstream status.** Upstream has nothing equivalent. diwenne/openreply#114 (open) adds a random delay before each reply, per account. That makes replies look less automated, but it does not limit DMs per hour or detect a block, so it does not replace this patch. If #114 is merged, it changes the same files (`lib/queue/dm-worker.ts`, `lib/queue/client.ts`, `lib/queue/process-webhook.ts`). Keep both: a delayed DM job must still take a pacing slot and can still be held during a block.

**Remove when.**

- Upstream limits comment DMs per hour per account, or spaces them some other way, so that a burst of comments cannot exceed a set rate. Then delete the slot pacing and `COMMENT_DM_MAX_PER_HOUR`, and set upstream's equivalent in production.
- Upstream detects an account-wide block (repeated 2534001 refusals from different people) and holds or retries those comments instead of failing them. Then delete the block hold.

Delete this entry only when both parts are gone.

## 2. Back off when Meta throttles sends

Commit `78d1eb6`.

**Why.** On a busy post, Meta started answering every send with code 613 ("the rate limit has exceeded"). Upstream did not classify 613 as a rate limit, so the worker kept sending, and good comments failed alongside bad ones. Delivered DMs fell from about 200 an hour to about 5 an hour.

**What the fork does.** Codes 613 and 80002 throw `RateLimitError`. A `RateLimitError` pauses the account's sends for 15 minutes (`pauseDMSends`). While the account is paused, `reserveDMSlot` refuses a slot and the job is requeued for the end of the pause, with up to 2 minutes of jitter. Other accounts are not affected.

**Code.** `lib/meta/client.ts` (the two `case` lines); `lib/utils/rate-limiter.ts` (`pauseDMSends`, the pause check in `reserveDMSlot`, `META_PAUSE_*`); the rate-limit branch in `lib/queue/dm-worker.ts`; tests in `__tests__/meta-errors.test.ts`, `__tests__/rate-limiter.test.ts` and `__tests__/dm-worker.test.ts`.

**Remove when.** Upstream classifies 613 and 80002 as rate limits and pauses or delays sends for that account when they occur.

## 3. Stop retrying private replies that Meta refuses for good

Commits `c72c20c` and `78d1eb6`.

**Why.** Upstream retried refusals that never succeed ("invalid for a private reply", closed messaging window, "user cannot be found", "thread owner has archived or deleted this conversation"). Each retry raised the same alert, and the comment sweep queued the same comments again on every pass, which added load during a throttle.

**What the fork does.** `isPermanentRejection` matches the messages in `NON_TEMPLATE_REJECTIONS`. Such a refusal fails the job once (`UnrecoverableError`) and uses up the comment's send budget, so the sweep stops queueing it again. With patch 1, a 2534001 refusal is first checked as a possible account block (`isThreadRefusal`).

**Code.** `lib/queue/dm-worker.ts` (`isPermanentRejection`, `NON_TEMPLATE_REJECTIONS`, `describeSendFailure`); tests in `__tests__/dm-worker.test.ts`.

**Remove when.** Upstream stops retrying these refusals and stops the sweep from queueing them again.

## 4. Bind "next reel" campaigns to a reel posted after they were armed

Commit `c72c20c` (upstream later adopted the rest of that commit).

**Why.** A campaign switched to "next reel" after it was created could bind to a reel that was already live, because upstream compares reels with the campaign's `createdAt`.

**What the fork does.** `Automation.nextReelArmedAt` records when the campaign started waiting, and binding uses it (falling back to `createdAt`).

**Code.** `prisma/schema.prisma` and the migration `20260923120000_add_next_reel_armed_at`; `app/api/automations/route.ts` (POST and PATCH set the field); `lib/automation/attach-next-reel.ts`; `__tests__/attach-next-reel.test.ts`.

**Remove when.** Upstream records when a campaign was armed for the next reel, or otherwise stops binding to reels posted before that. Keep the column if upstream's fix uses it; otherwise remove it with a new migration rather than editing the old one.

## 5. Build on Vercel without a database URL

Commit `6e6571f`.

**Why.** Vercel preview deployments have no `DATABASE_URL`, so `prisma migrate deploy` failed and every pull request's preview build failed.

**What the fork does.** `vercel-build` in `package.json` skips `prisma migrate deploy`, with a log line, when `DATABASE_URL` is unset. Production builds still run it.

**Remove when.** Upstream's `vercel-build` no longer fails without `DATABASE_URL`.

## 6. Stream a loading screen

Commit `59235e0`.

**Why.** The dashboard layout waits for several database queries before it sends anything. The installed app keeps its launch splash until the first paint, so opening a link showed the splash for several seconds.

**What the fork does.** `app/loading.tsx` streams a static fallback at once.

**Remove when.** Upstream adds a root `loading.tsx` or another Suspense boundary above the dashboard layout.

## Fork-only by design

- `CLAUDE.md`: the fork policy.
- `docs/fork-patches.md`: this file.

These stay as long as the fork exists.
