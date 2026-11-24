import { z } from "zod";
import type { Prisma } from "@/app/generated/prisma/client";
import { MAX_CAMPAIGN_POSTS } from "./post-limit";

export { MAX_CAMPAIGN_POSTS };

/** Oldest first: a campaign's first post is the one the campaigns list shows. */
export const CAMPAIGN_POST_ORDER = [
  { createdAt: "asc" },
  { id: "asc" },
] satisfies Prisma.AutomationPostOrderByWithRelationInput[];

/** A post as the API and the builder send and receive it. */
export type CampaignPost = { id: string; url: string | null };

export const campaignPostsInputSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      url: z.string().url().optional().nullable(),
    })
  )
  .max(MAX_CAMPAIGN_POSTS);

/**
 * The posts a create or update asks for. `posts` wins; the single
 * `postId` / `postUrl` pair is still accepted so older clients keep working.
 * Returns undefined when the request names no post at all (an update that
 * leaves the posts alone), and an empty list when it clears them.
 */
export function requestedCampaignPosts(input: {
  posts?: { id: string; url?: string | null }[] | null;
  postId?: string | null;
  postUrl?: string | null;
}): CampaignPost[] | undefined {
  if (input.posts !== undefined && input.posts !== null) {
    const seen = new Set<string>();
    const posts: CampaignPost[] = [];
    for (const post of input.posts) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      posts.push({ id: post.id, url: post.url ?? null });
    }
    return posts;
  }
  if (input.postId === undefined && input.posts === undefined) return undefined;
  return input.postId ? [{ id: input.postId, url: input.postUrl ?? null }] : [];
}

/**
 * Rows to create for a campaign's posts, in the order given. Each row is a
 * millisecond after the one before, so the first post stays first even when
 * every row is written in the same instant.
 */
export function campaignPostRows(posts: CampaignPost[], from = new Date()) {
  return posts.map((post, index) => ({
    postId: post.id,
    postUrl: post.url,
    createdAt: new Date(from.getTime() + index),
  }));
}

/**
 * Make a campaign's posts exactly `posts`. Posts that stay keep their row, so
 * they keep their place in the order; removed posts are deleted and new ones
 * are added after the rest.
 */
export async function syncCampaignPosts(
  tx: Prisma.TransactionClient,
  automationId: string,
  posts: CampaignPost[]
): Promise<void> {
  const ids = posts.map((post) => post.id);
  await tx.automationPost.deleteMany({
    where: { automationId, postId: { notIn: ids } },
  });

  const existing = await tx.automationPost.findMany({
    where: { automationId },
    select: { postId: true, postUrl: true },
  });
  const existingUrls = new Map(existing.map((row) => [row.postId, row.postUrl]));

  const added = posts.filter((post) => !existingUrls.has(post.id));
  if (added.length > 0) {
    await tx.automationPost.createMany({
      data: campaignPostRows(added).map((row) => ({ ...row, automationId })),
    });
  }

  // A post that stays may come with a link it did not have before.
  for (const post of posts) {
    if (!existingUrls.has(post.id) || !post.url) continue;
    if (existingUrls.get(post.id) === post.url) continue;
    await tx.automationPost.update({
      where: { automationId_postId: { automationId, postId: post.id } },
      data: { postUrl: post.url },
    });
  }
}

/**
 * The API shape of a campaign's posts: the `posts` list, plus `postId` and
 * `postUrl` for the first post. Those two predate campaigns with several
 * posts and are kept so existing integrations keep working.
 */
export function campaignPostFields(rows: { postId: string; postUrl: string | null }[]) {
  return {
    posts: rows.map((row): CampaignPost => ({ id: row.postId, url: row.postUrl })),
    /** @deprecated The first of `posts`. */
    postId: rows[0]?.postId ?? null,
    /** @deprecated The first of `posts`. */
    postUrl: rows[0]?.postUrl ?? null,
  };
}

/**
 * The campaign post a comment belongs to, for its DM log. A comment on an ad
 * carries the ad's media id and the post the ad was made from as
 * `originalMediaId`; the log records that post. An any-post campaign has no
 * posts of its own, so it records the post that got the comment.
 */
export function campaignPostForComment(
  postIds: string[],
  mediaId: string,
  originalMediaId?: string
): string {
  if (originalMediaId && postIds.includes(originalMediaId)) return originalMediaId;
  if (postIds.includes(mediaId)) return mediaId;
  return originalMediaId ?? mediaId;
}
