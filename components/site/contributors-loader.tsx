"use client";

import { useEffect, useState } from "react";
import { ContributorsView } from "./contributors-view";
import {
  GITHUB_API_CONTRIBUTORS,
  parseContributors,
  type Contributor,
} from "./github-shared";

const GRAPH_URL = "https://github.com/diwenne/openreply/graphs/contributors";

/** Used when the server could not reach GitHub: ask from the browser instead. */
export function ContributorsLoader() {
  const [state, setState] = useState<"loading" | "failed" | Contributor[]>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch(GITHUB_API_CONTRIBUTORS, { headers: { Accept: "application/vnd.github+json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const list = parseContributors(data);
        setState(list && list.length > 0 ? list : "failed");
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <p className="contrib-empty body-3 muted">Loading contributors…</p>;
  }
  if (state === "failed") {
    return (
      <p className="contrib-empty body-3 muted">
        The contributor list could not be loaded right now. You can see everyone
        on{" "}
        <a className="link-strong" href={GRAPH_URL}>
          GitHub
        </a>
        .
      </p>
    );
  }
  return <ContributorsView contributors={state} />;
}
