import Link from "next/link";
import type { ReactNode } from "react";
import { geist, inter } from "./font";
import {
  GITHUB_URL,
  SETUP_DOCS_URL,
  getGitHubStars,
} from "./github";
import { DiscordIcon, GithubIcon, XLogoIcon } from "./icons";
import { LogoMark } from "./logo";
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
              <LogoMark className="wordmark-mark" />
              <span>OpenReply</span>
            </Link>
            <p className="caption-5">
              Open source Instagram comment-to-DM automation.
            </p>
            <ul className="footer-social">
              <li>
                <a
                  href="https://github.com/diwennee"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                >
                  <GithubIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/diwennee"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X"
                >
                  <XLogoIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/p8DCB3USpM"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Discord"
                >
                  <DiscordIcon />
                </a>
              </li>
            </ul>
          </div>
          <nav className="footer-cols" aria-label="Footer navigation">
            <div className="footer-col">
              <h4>Project</h4>
              <a href={GITHUB_URL}>GitHub</a>
              <a href={SETUP_DOCS_URL}>Setup guide</a>
              <Link href="/templates">Templates</Link>
              <Link href="/brand">Brand</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/data-deletion">Data deletion</Link>
            </div>
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
