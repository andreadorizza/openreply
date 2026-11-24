/**
 * Most posts one campaign can listen on. The comment sweep reads the comments
 * of every campaign post, and an any-post campaign already reads the 10 most
 * recent posts, so a campaign with chosen posts never costs more than that.
 *
 * Kept apart from `posts.ts` so the campaign builder can import it without
 * pulling the server-side schema code into the browser bundle.
 */
export const MAX_CAMPAIGN_POSTS = 10;
