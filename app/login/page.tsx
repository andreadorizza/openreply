import { EMAIL_PROVIDER_ID, signIn } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import { DemoNotice } from "@/components/demo-notice";
import { isPublicDemoHost } from "@/lib/env";
import { LogoMark } from "@/components/site/logo";
import { siteClass } from "@/components/site/shell";
import Link from "next/link";
import { ArrowUpRightIcon, CaretLeftIcon } from "@/components/site/icons";
import "../site.css";

const GITHUB_URL = "https://github.com/diwenne/openreply";
const SETUP_DOCS_URL = `${GITHUB_URL}/blob/main/docs/setup.md`;

export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t("Login - OpenReply"),
    description: t("Sign in to manage Instagram comment-to-DM campaigns."),
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkEmail?: string;
    callbackUrl?: string;
    template?: string;
  }>;
}) {
  const { t } = await getI18n();
  if (await isPublicDemoHost()) {
    return (
      <div className={`${siteClass} auth`}>
        <Link href="/" className="auth-back body-5">
          <CaretLeftIcon /> Back to home
        </Link>
        <div className="auth-card">
          <div>
            <div className="auth-head">
              <h1 className="heading-5">{t("Sign-in is off on this demo")}</h1>
              <p className="body-6">
                {t("This is the public demo — it doesn’t create real accounts or send DMs. To use OpenReply for real, clone it and run your own instance with your own Meta app and domain.")}
              </p>
            </div>
            <a
              href={SETUP_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary button-md"
            >
              {t("Clone it yourself")} <ArrowUpRightIcon />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const checkEmail = params.checkEmail === "1";
  const selectedTemplate = getCampaignTemplate(params.template);
  const templateCallbackUrl = selectedTemplate
    ? `/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = params.callbackUrl ?? templateCallbackUrl ?? "/dashboard";

  async function sendMagicLink(formData: FormData) {
    "use server";
    await signIn(EMAIL_PROVIDER_ID, {
      email: String(formData.get("email") ?? ""),
      redirectTo: callbackUrl,
    });
  }

  return (
    <div className={`${siteClass} auth`}>
      <Link href="/" className="auth-back body-5">
        <CaretLeftIcon /> Back to home
      </Link>
      <div style={{ width: "100%", maxWidth: 416 }}>
        <DemoNotice variant="panel" />
        <div className="auth-card">
          <div>
            <div className="auth-head">
              <h1 className={checkEmail ? "heading-5" : "wordmark"} style={checkEmail ? undefined : { fontSize: 32, lineHeight: "40px" }}>
                {checkEmail ? (
                  t("Check your email")
                ) : (
                  <>
                    <LogoMark className="wordmark-mark" />
                    <span>OpenReply</span>
                  </>
                )}
              </h1>
              <p className="body-6">
                {checkEmail
                  ? t("We sent you a secure sign-in link. Open it on this device to continue.")
                  : selectedTemplate
                    ? t("Sign in to use the {name} template.", { name: selectedTemplate.title })
                    : t("Sign in by email, then connect your Instagram professional account.")}
              </p>
            </div>

            {selectedTemplate && !checkEmail && (
              <div className="notice body-6">
                <span className="caption-4 muted">{t("Template selected")}</span>
                <p className="body-4">{selectedTemplate.title}</p>
              </div>
            )}

            {!checkEmail && (
              <form action={sendMagicLink}>
                <div className="field">
                  <label htmlFor="email">{t("Work email")}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="input"
                  />
                </div>
                <button type="submit" className="btn btn-primary button-md">
                  {t("Email me a magic link")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
