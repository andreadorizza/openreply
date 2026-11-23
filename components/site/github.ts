import {
  GITHUB_API_CONTRIBUTORS,
  GITHUB_API_REPO,
  parseContributors,
  parseStars,
  type Contributor,
} from "./github-shared";

export type { Contributor };

export const GITHUB_URL = "https://github.com/diwenne/openreply";
export const SETUP_DOCS_URL = `${GITHUB_URL}/blob/main/docs/setup.md`;
export const ZERNIO_DOCS_URL = `${GITHUB_URL}/blob/main/docs/zernio.md`;
export const SUPPORT_URL = "https://buymeacoffee.com/diwen";

// GitHub allows 60 anonymous requests an hour per IP, and hosting platforms
// share IPs, so anonymous requests from a server often get refused. Set
// GITHUB_TOKEN (no scopes needed) to raise that limit. When the server can't
// get the data anyway, the pages fall back to asking GitHub from the browser.
function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getGitHubStars(): Promise<number | null> {
  try {
    const res = await fetch(GITHUB_API_REPO, {
      headers: githubHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return parseStars(await res.json());
  } catch {
    return null;
  }
}

export async function getGitHubContributors(): Promise<Contributor[] | null> {
  try {
    const res = await fetch(GITHUB_API_CONTRIBUTORS, {
      headers: githubHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return parseContributors(await res.json());
  } catch {
    return null;
  }
}
