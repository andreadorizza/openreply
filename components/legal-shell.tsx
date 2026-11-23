import { SitePage } from "@/components/site/shell";

interface LegalShellProps {
  title: string;
  description: string;
  updatedAt: string;
  children: React.ReactNode;
}

export default function LegalShell({
  title,
  description,
  updatedAt,
  children,
}: LegalShellProps) {
  return (
    <SitePage>
      <article className="wrap-narrow legal">
        <span className="eyebrow-chip caption-4">Last updated {updatedAt}</span>
        <h1 className="heading-3">{title}</h1>
        <p className="body-3 muted" style={{ marginTop: 16 }}>
          {description}
        </p>
        <div className="legal-body body-3">{children}</div>
      </article>
    </SitePage>
  );
}
