// Safe to import from client components: no secrets, no server only APIs.
export const GITHUB_API_REPO = "https://api.github.com/repos/diwenne/openreply";
export const GITHUB_API_CONTRIBUTORS = `${GITHUB_API_REPO}/contributors?per_page=100`;

export interface Contributor {
  login: string;
  url: string;
  avatar: string;
  contributions: number;
}

export function parseStars(data: unknown): number | null {
  const count = (data as { stargazers_count?: unknown } | null)?.stargazers_count;
  return typeof count === "number" ? count : null;
}

export function parseContributors(data: unknown): Contributor[] | null {
  if (!Array.isArray(data)) return null;
  return (
    data as Array<{
      login?: string;
      html_url?: string;
      avatar_url?: string;
      contributions?: number;
      type?: string;
    }>
  )
    .filter((item) => item.type === "User" && item.login)
    .map((item) => ({
      login: item.login as string,
      url: item.html_url ?? `https://github.com/${item.login}`,
      avatar: `${item.avatar_url ?? ""}${item.avatar_url?.includes("?") ? "&" : "?"}s=160`,
      contributions: item.contributions ?? 0,
    }));
}
