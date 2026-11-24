# Fork patches

This repository is a fork of [diwennee/openreply](https://github.com/diwennee/openreply). It carries a few changes that upstream does not have. Each one is listed here with the reason, the code it touches, and the upstream change that would make it unnecessary.

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

**Why.** Upstream retried refusals that never succeed ("invalid for a private reply", closed messaging window, "user cannot be found"). Each retry raised the same alert, and the comment sweep queued the same comments again on every pass, which added load during a throttle.

**What the fork does.** `isPermanentRejection` matches the messages in `NON_TEMPLATE_REJECTIONS`. Such a refusal fails the job once (`UnrecoverableError`) and uses up the comment's send budget, so the sweep stops queueing it again. A 2534001 refusal ("thread owner has archived or deleted this conversation") is not on that list: it may be the start of an account-wide block (upstream's `isThreadRefusal`, diwennee/openreply#116), so it is retried as upstream does, and the retries are held once the block is recognised.

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

## 5. Campaigns on several chosen posts

Commit `22f825b`, on branch `feat/multi-post-campaigns`, which is cut from upstream so it can become the upstream pull request unchanged.

**Why.** Trial reels for the same offer share one keyword and one set of links. Upstream lets a campaign listen on one post or on any post, so covering several trial reels meant "any post", which also fires on unrelated posts.

**What the fork does.** A campaign holds up to 10 posts, each a row in `AutomationPost`. The worker, the comment sweep, "next reel", duplication, the API, MCP and the dashboard use them. `DmLog.postId` records which campaign post a comment came from. The design is in `GLOSSARY.md` and `docs/adr/0001-one-row-per-campaign-post.md`.

**Code.** `prisma/schema.prisma` and the migration `20261124120000_campaign_posts`; `lib/campaigns/posts.ts` and `post-limit.ts`; `lib/queue/dm-worker.ts`; `lib/polling/comment-reconciler.ts`; `lib/automation/attach-next-reel.ts`; `lib/campaigns/duplicate.ts`; `app/api/automations/route.ts` and `import/route.ts`; `lib/integrations/campaigns.ts`; `lib/reports/data.ts`; `components/post-picker.tsx` and `campaign-builder.tsx`; the campaigns list, campaign page and report page; the four translation catalogs. Tests in `__tests__/campaign-posts.test.ts`, plus updated fixtures elsewhere.

**Upstream status.** Proposed in diwennee/openreply#135. The pull request waits for the maintainer's reply on the issue and for this fork to run it on real campaigns.

**Remove when.** Upstream merges campaigns with several posts. Keep the migration's name and contents identical in the upstream pull request: this fork's database has already applied it, so an edited copy would fail Prisma's checksum. If upstream ships a different design, move to it with a new migration rather than editing this one.

## Fork-only by design

- `CLAUDE.md`: the fork policy.
- `docs/fork-patches.md`: this file.
- `GLOSSARY.md`: the domain terms used when designing changes, for the fork and for upstream.
- `docs/adr/`: design decisions and why they were made.

These stay as long as the fork exists.
