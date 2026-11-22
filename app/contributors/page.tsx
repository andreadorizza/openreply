import type { Metadata } from "next";
import { ArrowUpRightIcon } from "@/components/site/icons";
import { GITHUB_URL, getGitHubContributors } from "@/components/site/github";
import { ContributorsLoader } from "@/components/site/contributors-loader";
import { ContributorsView } from "@/components/site/contributors-view";
import { SitePage } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Contributors - OpenReply",
  description:
    "The people who have contributed code to OpenReply, the free and open source Instagram comment-to-DM tool.",
};

export default async function ContributorsPage() {
  const contributors = await getGitHubContributors();

  return (
    <SitePage active="contributors">
      <section className="wrap page-center">
        <h1 className="heading-1">Contributors</h1>
        <p className="page-center-sub body-3">
          The people who have contributed code to OpenReply, the free and open
          source Instagram comment-to-DM tool.
        </p>

        {contributors && contributors.length > 0 ? (
          <ContributorsView contributors={contributors} />
        ) : (
          <ContributorsLoader />
        )}

        <p className="contrib-cta body-3 muted">
          Want to help?{" "}
          <a
            className="link-strong"
            href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`}
          >
            Read the contributing guide <ArrowUpRightIcon />
          </a>
        </p>
      </section>
    </SitePage>
  );
}
