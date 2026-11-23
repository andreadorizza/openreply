import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SitePage } from "@/components/site/shell";
import { ArrowUpRightIcon, CaretLeftIcon } from "@/components/site/icons";
import { Reveal } from "@/components/site/reveal";
import TemplateVisual from "@/components/template-visual";
import {
  CAMPAIGN_TEMPLATES,
  getCampaignTemplate,
  getCampaignTemplateSlugs,
} from "@/lib/templates/campaign-templates";

type TemplatePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getCampaignTemplateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: TemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getCampaignTemplate(slug);

  if (!template) {
    return {
      title: "Template Not Found - OpenReply",
    };
  }

  return {
    title: `${template.title} - Instagram Comment to DM Template`,
    description: template.summary,
    keywords: [
      `${template.title} template`,
      "Instagram comment to DM template",
      "Instagram DM campaign template",
      template.category,
      template.audience,
    ],
  };
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const template = getCampaignTemplate(slug);

  if (!template) {
    notFound();
  }

  const relatedTemplates = CAMPAIGN_TEMPLATES.filter(
    (item) => item.slug !== template.slug
  ).slice(0, 3);

  return (
    <SitePage active="templates">
      <section className="wrap page-hero">
        <Link href="/templates" className="link button-sm back-link" style={{ display: "inline-flex" }}>
          <CaretLeftIcon /> Back to templates
        </Link>
        <div className="page-hero-grid">
          <div>
            <span className="eyebrow">{template.category} template</span>
            <h1 className="heading-2">{template.title}</h1>
            <p className="page-hero-sub body-3">{template.summary}</p>
            <div className="hero-actions">
              <Link
                href={`/login?template=${template.slug}`}
                className="btn btn-primary btn-lg button-md"
              >
                Use this template <ArrowUpRightIcon />
              </Link>
              <a href="#playbook" className="link button-sm">
                Read playbook
              </a>
            </div>
          </div>
          <div className="tpl-hero-visuals" style={{ gridTemplateColumns: "1fr" }}>
            <div className="tpl-visual-wrap">
              <div>
                <TemplateVisual template={template} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 32 }}>
        <div className="split">
          <aside className="meta-stack">
            <div className="meta">
              <span className="caption-4">Audience</span>
              <strong className="body-2">{template.audience}</strong>
            </div>
            <div className="meta">
              <span className="caption-4">Setup time</span>
              <strong className="body-2">{template.setupMinutes} minutes</strong>
            </div>
            <div className="meta">
              <span className="caption-4">Campaign goal</span>
              <strong className="body-2">{template.goal}</strong>
            </div>
          </aside>

          <div id="playbook" style={{ display: "grid", gap: 16, scrollMarginTop: 96 }}>
            <Reveal className="card">
              <h2 className="heading-6">Campaign outcome</h2>
              <p className="body-3">{template.outcome}</p>
            </Reveal>
            <Reveal className="card">
              <h2 className="heading-6">Setup playbook</h2>
              <ol className="numbered body-5" style={{ marginTop: 24 }}>
                {template.playbook.map((step, index) => (
                  <li key={step}>
                    <span className="caption-3">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </Reveal>
            <div className="card-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Reveal className="card">
                <h2 className="heading-6">Best for</h2>
                <ul className="checklist body-6" style={{ marginTop: 16 }}>
                  {template.bestFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="card" delay={80}>
                <h2 className="heading-6">Metrics to watch</h2>
                <ul className="checklist body-6" style={{ marginTop: 16 }}>
                  {template.metrics.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal className="card">
              <h2 className="heading-6">Copy this campaign into OpenReply</h2>
              <p className="body-6">
                Sign in, connect Instagram, pick a post or reel, and the
                template copy will be ready for your campaign draft.
              </p>
              <div className="hero-actions" style={{ justifyContent: "flex-start" }}>
                <Link
                  href={`/login?template=${template.slug}`}
                  className="btn btn-primary button-md"
                >
                  Use this template
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <h2 className="heading-5" style={{ marginBottom: 24 }}>More templates</h2>
        <div className="card-grid">
          {relatedTemplates.map((item) => (
            <Link key={item.slug} href={`/templates/${item.slug}`} className="card" style={{ display: "block" }}>
              <span className="caption-4 muted">{item.category}</span>
              <h3 className="heading-6" style={{ marginTop: 4 }}>{item.title}</h3>
              <p className="body-6">{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </SitePage>
  );
}
