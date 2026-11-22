import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRightIcon } from "@/components/site/icons";
import { SUPPORT_URL } from "@/components/site/github";
import { SitePage } from "@/components/site/shell";
import { zernioLink } from "@/lib/zernio-links";

export const metadata: Metadata = {
  title: "Sponsors - OpenReply",
  description: "The companies that support OpenReply.",
};

export default function SponsorsPage() {
  return (
    <SitePage active="sponsors">
      <section className="wrap page-center">
        <h1 className="heading-1">Sponsors</h1>
        <p className="page-center-sub body-3">
          OpenReply is free and open source. These are the companies that
          support it.
        </p>

        <ul className="sponsor-cards">
          <li>
            <a
              className="sponsor-card"
              href={zernioLink({ placement: "sponsors-page" })}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              <Image
                src="/brand/zernio-primary.svg"
                alt=""
                width={120}
                height={40}
                className="sponsor-card-logo sponsor-card-logo-wide"
              />
              <h2 className="heading-6">
                Zernio <ArrowUpRightIcon />
              </h2>
              <p className="body-6 muted">
                An optional paid Instagram connection provider. It manages the
                connection so you can skip creating your own Meta app.
              </p>
            </a>
          </li>
        </ul>

        <div className="sponsor-contact">
          <h2 className="heading-5">Want to sponsor OpenReply?</h2>
          <p className="body-3 muted">
            Email{" "}
            <a className="link-strong" href="mailto:diwennee@gmail.com">
              diwennee@gmail.com
            </a>
            . If you would rather support it personally, you can{" "}
            <a
              className="link-strong"
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
            >
              buy me a coffee
            </a>
            .
          </p>
        </div>
      </section>
    </SitePage>
  );
}
