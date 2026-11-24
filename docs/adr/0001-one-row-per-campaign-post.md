# One row per campaign post

A campaign can listen on several chosen posts, up to 10. Each campaign post is a row of its own (campaign, post, link, when it was added), not a list of post IDs on the campaign. Every post needs its own link: "copy link", "open post", the video player and the public report all use it. Parallel lists of IDs and links can drift out of step. A row per post also keeps the lookup from a comment to its campaigns a plain indexed query, and lets two campaigns share a post.

## Considered options

- **Post IDs and links as two array columns on the campaign.** Smaller diff, but the two lists must stay in step by hand, and each array lookup needs a GIN index.
- **One JSON column of `{id, url}` objects.** Keeps ID and link together, but the comment lookup becomes a JSON query.

## Consequences

The campaign's single `postId` and `postUrl` columns go away. Existing campaigns move into one row each. The v1 API and MCP keep returning `postId` and `postUrl` (the first post, deprecated) next to the new `posts` list, so existing integrations keep working.
