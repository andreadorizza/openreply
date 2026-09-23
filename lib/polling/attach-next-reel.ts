/**
 * Binds "next reel" campaigns to a real post.
 *
 * Instagram sends no webhook when a new media is published, so we poll: for
 * every campaign awaiting the creator's next reel, find the earliest reel that
 * was posted after the campaign started waiting and attach the campaign to it.
 *
 * Runs from the cron route and from the worker's poll loop. The worker is what
 * makes it prompt: Vercel's free cron fires once a day, which leaves a reel
 * posted in the evening unbound until the next morning.
 */

import { prisma } from "@/lib/db/client";
import { getUserMedia, type InstagramMedia } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/oauth";

function isReel(media: InstagramMedia): boolean {
  return media.media_product_type === "REELS";
}

export interface AttachNextReelResult {
  checked: number;
  bound: number;
  failedAccounts: number;
}

export async function attachNextReels(): Promise<AttachNextReelResult> {
  const pending = await prisma.automation.findMany({
    where: { pendingNextReel: true },
    include: { instagramAccount: true },
  });

  // Group by connected account so we fetch each account's media only once.
  const byAccount = new Map<
    string,
    { account: (typeof pending)[number]["instagramAccount"]; automations: typeof pending }
  >();
  for (const automation of pending) {
    const key = automation.instagramAccountId;
    const entry = byAccount.get(key);
    if (entry) entry.automations.push(automation);
    else byAccount.set(key, { account: automation.instagramAccount, automations: [automation] });
  }

  let bound = 0;
  let checked = 0;
  let failedAccounts = 0;

  for (const { account, automations } of byAccount.values()) {
    checked += automations.length;
    if (!account?.accessToken) continue;

    let reels: InstagramMedia[];
    try {
      const token = decryptToken(account.accessToken);
      const media = await getUserMedia(token, 25);
      reels = media
        .filter(isReel)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    } catch (err) {
      failedAccounts += 1;
      console.error("[attach-next-reel] media fetch failed", account.id, err);
      continue;
    }

    for (const automation of automations) {
      // The "next" reel = the earliest one posted after the campaign started
      // waiting. Campaigns from before nextReelArmedAt existed fall back to
      // createdAt, which the migration also backfills.
      const armedAt = automation.nextReelArmedAt ?? automation.createdAt;
      const nextReel = reels.find((reel) => new Date(reel.timestamp) > armedAt);
      if (!nextReel) continue;

      // Conditional on still pending, so the cron and the worker binding the
      // same campaign at once cannot both write it.
      const { count } = await prisma.automation.updateMany({
        where: { id: automation.id, pendingNextReel: true },
        data: {
          postId: nextReel.id,
          postUrl: nextReel.permalink ?? null,
          pendingNextReel: false,
        },
      });
      bound += count;
    }
  }

  return { checked, bound, failedAccounts };
}
