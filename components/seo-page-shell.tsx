import Link from "next/link";
import { SitePage } from "@/components/site/shell";
import { ArrowUpRightIcon } from "@/components/site/icons";
import { InstagramDm } from "@/components/site/instagram";
import { Faq } from "@/components/site/faq";
import { Reveal } from "@/components/site/reveal";

export interface SeoPageSection {
  title: string;
  body: string;
}

export interface SeoPageConfig {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta?: string;
  bullets: string[];
  sections: SeoPageSection[];
  comparisonTitle: string;
  comparisons: Array<{
    label: string;
    ours: string;
    other: string;
  }>;
  templateLinks: Array<{
    label: string;
    href: string;
  }>;
  faqs: SeoPageSection[];
}

export default function SeoPageShell({ config }: { config: SeoPageConfig }) {
  return (
    <SitePage>
      <section className="wrap page-hero">
        <div className="page-hero-grid">
          <div>
            <span className="eyebrow">{config.eyebrow}</span>
            <h1 className="heading-2">{config.title}</h1>
            <p className="page-hero-sub body-3">{config.description}</p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary btn-lg button-md">
                {config.primaryCta} <ArrowUpRightIcon />
              </Link>
              <Link href="/templates" className="link button-sm">
                {config.secondaryCta ?? "Browse templates"}
              </Link>
            </div>
          </div>
          <div className="hero-phone">
            <InstagramDm />
          </div>
        </div>
      </section>

      <section className="section wrap" style={{ paddingTop: 16 }}>
        <div className="panel">
          <p className="panel-label">Campaign OS checklist</p>
          <ul className="checklist body-6" data-cols="2">
            {config.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <ul className="card-grid">
          {config.sections.map((section, i) => (
            <li key={section.title}>
              <Reveal className="card" delay={i * 80}>
                <h2 className="heading-6">{section.title}</h2>
                <p className="body-6">{section.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <Reveal>
          <h2 className="heading-4" style={{ marginBottom: 32 }}>
            {config.comparisonTitle}
          </h2>
          <div className="compare body-6">
            <div className="compare-row">
              <div>Need</div>
              <div>OpenReply</div>
              <div>Generic automation</div>
            </div>
            {config.comparisons.map((item) => (
              <div key={item.label} className="compare-row">
                <div>{item.label}</div>
                <div>{item.ours}</div>
                <div>{item.other}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <div className="split">
          <Reveal>
            <span className="eyebrow">Start from a template</span>
            <h2 className="heading-4">
              Launch a campaign faster than building a chatbot flow
            </h2>
            <p className="body-6 muted" style={{ marginTop: 16 }}>
              Use a campaign template, connect the right Instagram account, pick
              the post, and ship a measurable comment-to-DM loop.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="link-grid">
              {config.templateLinks.map((link) => (
                <Link key={link.href} href={link.href} className="link-tile body-5">
                  {link.label}
                  <ArrowUpRightIcon />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <div className="faq">
          <Reveal>
            <span className="eyebrow">FAQ</span>
            <h2 className="heading-4">Common questions</h2>
          </Reveal>
          <Reveal delay={80}>
            <Faq items={config.faqs.map((faq) => ({ q: faq.title, a: faq.body }))} />
          </Reveal>
        </div>
      </section>

      <section className="closing wrap" style={{ paddingTop: 0 }}>
        <Reveal>
          <h2 className="heading-3">
            Turn the next high-intent comment into a private reply
          </h2>
          <p className="body-3" style={{ maxWidth: 560, marginInline: "auto" }}>
            OpenReply works with Instagram professional accounts and official
            Meta private replies, and its campaign reports are ones you can show
            clients.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="btn btn-primary btn-lg button-md">
              Start free <ArrowUpRightIcon />
            </Link>
          </div>
        </Reveal>
      </section>
    </SitePage>
  );
}
