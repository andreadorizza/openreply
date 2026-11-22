"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GITHUB_API_REPO, parseStars } from "./github-shared";
import { ArrowUpRightIcon, GithubIcon } from "./icons";

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
  current?: boolean;
}

function formatStars(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toLocaleString();
}

export function SiteNav({
  links,
  githubUrl,
  stars: serverStars,
}: {
  links: NavLink[];
  githubUrl: string;
  stars: number | null;
}) {
  const [open, setOpen] = useState(false);
  // The server could not reach GitHub (rate limited, usually), so ask from the
  // visitor's browser instead.
  const [browserStars, setBrowserStars] = useState<number | null>(null);
  const stars = serverStars ?? browserStars;

  useEffect(() => {
    if (serverStars !== null) return;
    let cancelled = false;
    fetch(GITHUB_API_REPO, { headers: { Accept: "application/vnd.github+json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const count = parseStars(data);
        if (!cancelled && count !== null) setBrowserStars(count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [serverStars]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="header">
        <div className="wrap nav">
          <div className="nav-brand">
            <Link
              href="/"
              className="wordmark"
              aria-label="OpenReply home"
              onClick={() => setOpen(false)}
            >
              OpenReply
            </Link>
            <a
              className="nav-stars"
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="View OpenReply on GitHub"
            >
              <GithubIcon />
              {stars !== null && <span>{formatStars(stars)} stars</span>}
            </a>
          </div>
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((link) =>
              link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={link.current ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
          <div className="nav-cta">
            <Link className="nav-signin" href="/login">
              Sign in
            </Link>
            <Link className="btn button-sm nav-get-started" href="/login">
              Get started <ArrowUpRightIcon />
            </Link>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={open}
              aria-controls="nav-panel"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <div
        id="nav-panel"
        className="nav-panel"
        data-open={open}
        aria-hidden={!open}
      >
        <nav className="nav-panel-links" aria-label="Mobile navigation">
          {links.map((link, i) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                style={{ ["--i" as string]: i }}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                style={{ ["--i" as string]: i }}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <div className="nav-panel-actions">
          <Link
            href="/login"
            className="btn btn-primary btn-lg button-md"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
          >
            Get started <ArrowUpRightIcon />
          </Link>
          <Link
            href="/login"
            className="btn btn-lg button-md"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
          >
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
}
