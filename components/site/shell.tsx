import Link from "next/link";
import type { ReactNode } from "react";
import { geist, inter } from "./font";
import {
  GITHUB_URL,
  SETUP_DOCS_URL,
  SUPPORT_URL,
  getGitHubStars,
} from "./github";
import { SiteNav, type NavLink } from "./nav";
import { SponsorCredit } from "./sponsor";
import "@/app/site.css";

export const siteClass = `site ${geist.className} ${inter.variable}`;

export async function SiteHeader({ active }: { active?: string }) {
  const stars = await getGitHubStars();
  const links: NavLink[] = [
    { label: "How it works", href: "/#how" },
    { label: "Self-host it", href: "/#setup" },
    {
      label: "Contributors",
      href: "/contributors",
      current: active === "contributors",
    },
    { label: "Sponsors", href: "/sponsors", current: active === "sponsors" },
  ];
  return <SiteNav links={links} githubUrl={GITHUB_URL} stars={stars} />;
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Link href="/" className="wordmark">
              OpenReply
            </Link>
            <p className="caption-5">
              Open source Instagram comment-to-DM automation.
            </p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href={GITHUB_URL}>GitHub</a>
            <a href={SETUP_DOCS_URL}>Setup guide</a>
            <Link href="/templates">Templates</Link>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
              Buy me a coffee
            </a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/data-deletion">Data deletion</Link>
          </nav>
        </div>
        <div className="footer-bottom caption-5">
          <span>
            MIT licensed · Built by{" "}
            <a className="link-strong" href="https://diwenhuang.ca">
              Diwen Huang
            </a>
          </span>
          <SponsorCredit placement="landing-footer" />
        </div>
      </div>
    </footer>
  );
}

export function SitePage({
  children,
  active,
}: {
  children: ReactNode;
  active?: string;
}) {
  return (
    <div className={siteClass}>
      <a className="skip button-sm" href="#main">
        Skip to content
      </a>
      <SiteHeader active={active} />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
