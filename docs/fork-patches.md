# Fork patches

This repository is a fork of [diwenne/openreply](https://github.com/diwenne/openreply). It carries a few changes that upstream does not have. Each one is listed here with the reason, the code it touches, and the upstream change that would make it unnecessary.

Every fork patch is temporary. When upstream ships a fix for the same problem, the fork drops its own code and uses upstream's fix, even if the fork's version is more complete. If upstream fixes only part of the problem, the fork keeps only the part upstream does not cover, built on upstream's structure.

Last checked against upstream `1eb827b` on 2026-11-22.

## How to use this file

When you sync with upstream (merge `upstream/main`):

1. For each patch below, compare its **Remove when** condition with the upstream commits you are merging. Also check whether the upstream pull requests named under **Upstream status** were merged.
2. If upstream now covers a patch, delete the fork code, its tests and its docs in the sync, and delete its entry here. List what you removed in the sync pull request.
3. If upstream covers part of a patch, or changes the same code without covering it, keep upstream's structure, keep only the fork behaviour upstream lacks, and update the entry.
4. Update the "Last checked" line above.

When you add fork-only code, add an entry here in the same pull request. `git diff --stat upstream/main` should list only files that belong to an entry here.

## 1. Stop retrying private replies that Meta refuses for good

Commits `c72c20c` and `78d1eb6`.

**Why.** Upstream retried refusals that never succeed ("invalid for a private reply", closed messaging window, "user cannot be found", "thread owner has archived or deleted this conversation"). Each retry raised the same alert, and the comment sweep queued the same comments again on every pass, which added load during a throttle.

**What the fork does.** `isPermanentRejection` matches the messages in `NON_TEMPLATE_REJECTIONS`. Such a refusal fails the job once (`UnrecoverableError`) and uses up the comment's send budget, so the sweep stops queueing it again. A 2534001 refusal is first checked as a possible account-wide block by upstream's `isThreadRefusal` (diwenne/openreply#116); only a refusal that is not part of a block fails for good.

**Code.** `lib/queue/dm-worker.ts` (`isPermanentRejection`, `NON_TEMPLATE_REJECTIONS`, `describeSendFailure`); tests in `__tests__/dm-worker.test.ts`.

**Remove when.** Upstream stops retrying these refusals and stops the sweep from queueing them again.

## 2. Bind "next reel" campaigns to a reel posted after they were armed

Commit `c72c20c` (upstream later adopted the rest of that commit).

**Why.** A campaign switched to "next reel" after it was created could bind to a reel that was already live, because upstream compares reels with the campaign's `createdAt`.

**What the fork does.** `Automation.nextReelArmedAt` records when the campaign started waiting, and binding uses it (falling back to `createdAt`).

**Code.** `prisma/schema.prisma` and the migration `20260923120000_add_next_reel_armed_at`; `app/api/automations/route.ts` (POST and PATCH set the field); `lib/automation/attach-next-reel.ts`; `__tests__/attach-next-reel.test.ts`.

**Remove when.** Upstream records when a campaign was armed for the next reel, or otherwise stops binding to reels posted before that. Keep the column if upstream's fix uses it; otherwise remove it with a new migration rather than editing the old one.

## 3. Build on Vercel without a database URL

Commit `6e6571f`.

**Why.** Vercel preview deployments have no `DATABASE_URL`, so `prisma migrate deploy` failed and every pull request's preview build failed.

**What the fork does.** `vercel-build` in `package.json` skips `prisma migrate deploy`, with a log line, when `DATABASE_URL` is unset. Production builds still run it.

**Remove when.** Upstream's `vercel-build` no longer fails without `DATABASE_URL`.

## 4. Stream a loading screen

Commit `59235e0`.

**Why.** The dashboard layout waits for several database queries before it sends anything. The installed app keeps its launch splash until the first paint, so opening a link showed the splash for several seconds.

**What the fork does.** `app/loading.tsx` streams a static fallback at once.

**Remove when.** Upstream adds a root `loading.tsx` or another Suspense boundary above the dashboard layout.

## Fork-only by design

- `CLAUDE.md`: the fork policy.
- `docs/fork-patches.md`: this file.

These stay as long as the fork exists.
