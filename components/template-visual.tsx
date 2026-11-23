import type { CampaignTemplate } from "@/lib/templates/campaign-templates";

interface TemplateVisualProps {
  template: CampaignTemplate;
  compact?: boolean;
}

/** A comment and the private reply it triggers, drawn like the Instagram app. */
export default function TemplateVisual({
  template,
  compact = false,
}: TemplateVisualProps) {
  return (
    <div className="tpl-visual-inner" data-compact={compact}>
      <div className="tv-comment">
        <span className="tv-avatar" aria-hidden="true">
          M
        </span>
        <p>
          <strong>maya.creates</strong> {template.triggerExample}
        </p>
      </div>
      <div className="tv-arrow caption-5">
        Keyword <b>{template.keywords[0]}</b> matched
      </div>
      <div className="tv-dm">
        <p>{template.privateReplyPreview}</p>
      </div>
    </div>
  );
}
