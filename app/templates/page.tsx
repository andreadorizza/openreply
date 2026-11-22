import type { Metadata } from "next";
import Link from "next/link";
import { SitePage } from "@/components/site/shell";
import { ArrowUpRightIcon } from "@/components/site/icons";
import { Reveal } from "@/components/site/reveal";
import TemplateVisual from "@/components/template-visual";
import { CAMPAIGN_TEMPLATES } from "@/lib/templates/campaign-templates";

export const metadata: Metadata = {
  title: "Instagram Comment to DM Templates - OpenReply",
  description:
    "Copy ready-to-launch Instagram comment-to-DM campaign templates for product links, lead magnets, real estate, fitness, restaurants, events, and creators.",
  keywords: [
    "Instagram comment to DM templates",
    "comment to DM campaigns",
    "Instagram DM automation templates",
    "Manychat alternative templates",
  ],
};

export default function TemplatesPage() {
  return (
    <SitePage active="templates">
      <section className="wrap page-hero">
        <div className="page-hero-grid">
          <div>
            <span className="eyebrow">Public template library</span>
            <h1 className="heading-2">
              Instagram campaigns you can copy in minutes
            </h1>
            <p className="page-hero-sub body-3">
              Start with proven comment-to-DM playbooks for lead magnets,
              product links, events, service menus, and agency client campaigns.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary btn-lg button-md">
                Start free <ArrowUpRightIcon />
              </Link>
              <a href="#template-grid" className="link button-sm">
                Browse templates
              </a>
            </div>
          </div>
          <div className="tpl-hero-visuals">
            {CAMPAIGN_TEMPLATES.slice(0, 2).map((template) => (
              <div key={template.slug} className="tpl-visual-wrap">
                <div>
                  <TemplateVisual template={template} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="template-grid" className="wrap section" style={{ paddingTop: 32, scrollMarginTop: 96 }}>
        <div className="tpl-grid">
          {CAMPAIGN_TEMPLATES.map((template, i) => (
            <Reveal key={template.slug} delay={(i % 4) * 60}>
              <article className="tpl" style={{ height: "100%" }}>
                <div className="tpl-visual">
                  <TemplateVisual template={template} compact />
                </div>
                <div className="tpl-body">
                  <span className="tpl-cat caption-4">{template.category}</span>
                  <h2 className="heading-6">{template.title}</h2>
                  <p className="body-6">{template.summary}</p>
                  <div className="app-chips" style={{ marginTop: 16 }}>
                    {template.keywords.map((keyword) => (
                      <span key={keyword} className="app-chip">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="tpl-actions">
                    <Link
                      href={`/login?template=${template.slug}`}
                      className="btn btn-primary button-sm"
                    >
                      Use this template
                    </Link>
                    <Link
                      href={`/templates/${template.slug}`}
                      className="btn button-sm"
                    >
                      View playbook
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </SitePage>
  );
}
