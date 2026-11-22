import type { Metadata } from "next";
import { SitePage } from "@/components/site/shell";
import { ArrowDownIcon } from "@/components/site/icons";

export const metadata: Metadata = {
  title: "Brand - OpenReply",
  description:
    "Download the OpenReply symbol, lockup and wordmark, and see how to use them.",
};

const base = "/brand/openreply";

function Downloads({ name }: { name: string }) {
  return (
    <p className="brand-files caption-4">
      <a href={`${base}-${name}.svg`} download>
        SVG
      </a>
      <a href={`${base}-${name}.png`} download>
        PNG
      </a>
    </p>
  );
}

function Panel({
  name,
  dark = false,
  tall = false,
  alt,
}: {
  name: string;
  dark?: boolean;
  tall?: boolean;
  alt: string;
}) {
  return (
    <div>
      <div className={`brand-panel ${dark ? "brand-panel-dark" : ""} ${tall ? "brand-panel-tall" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${base}-${name}.svg`} alt={alt} />
      </div>
      <Downloads name={name} />
    </div>
  );
}

const colors = [
  { name: "Ink", hex: "#22221f", light: false },
  { name: "Paper", hex: "#faf9f6", light: true },
  { name: "Peach", hex: "#f6e6d8", light: true },
  { name: "Orange", hex: "#c4490c", light: false },
];

export default function BrandPage() {
  return (
    <SitePage>
      <section className="wrap page-center" style={{ paddingBottom: 48 }}>
        <h1 className="heading-1">Brand</h1>
        <p className="page-center-sub body-3">
          Download the OpenReply symbol, lockup and wordmark for use in your
          projects.
        </p>
        <div className="hero-actions">
          <a
            className="btn button-sm"
            href="/brand/openreply-brand-assets.zip"
            download
          >
            <ArrowDownIcon /> Download all
          </a>
        </div>
      </section>

      <section className="wrap brand-sections">
        <div>
          <h2 className="heading-6">Symbol</h2>
          <p className="body-6 muted">
            Use the symbol on its own when the OpenReply name is already
            present nearby or space is limited.
          </p>
          <div className="brand-grid">
            <Panel name="symbol-ink" alt="OpenReply symbol in ink" />
            <Panel name="symbol-white" dark alt="OpenReply symbol in white" />
          </div>
        </div>

        <div>
          <h2 className="heading-6">Lockup</h2>
          <p className="body-6 muted">
            The full lockup combines the symbol and the wordmark. Prefer it
            wherever there is enough horizontal space.
          </p>
          <div className="brand-grid">
            <Panel name="lockup-ink" alt="OpenReply lockup in ink" />
            <Panel name="lockup-white" dark alt="OpenReply lockup in white" />
          </div>
        </div>

        <div>
          <h2 className="heading-6">Wordmark</h2>
          <p className="body-6 muted">
            The name on its own, set in Inter Light.
          </p>
          <div className="brand-grid">
            <Panel name="wordmark-ink" alt="OpenReply wordmark in ink" />
            <Panel name="wordmark-white" dark alt="OpenReply wordmark in white" />
          </div>
        </div>

        <div>
          <h2 className="heading-6">App icon</h2>
          <p className="body-6 muted">
            The symbol in white on black. It is used for the browser tab and
            the home screen.
          </p>
          <div className="brand-grid">
            <Panel name="app-icon" alt="OpenReply app icon" />
          </div>
        </div>

        <div>
          <h2 className="heading-6">Colors</h2>
          <ul className="brand-colors">
            {colors.map((color) => (
              <li key={color.name}>
                <span
                  className="brand-swatch"
                  style={{ background: color.hex, borderColor: color.light ? "var(--s3)" : color.hex }}
                />
                <strong className="title-4">{color.name}</strong>
                <span className="caption-4 muted">{color.hex}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="heading-6">Typography</h2>
          <p className="body-6 muted">
            The wordmark is Inter Light. Text on the site is set in Geist.
          </p>
        </div>
      </section>

      <section className="wrap-narrow brand-usage">
        <div>
          <h2 className="heading-6">Usage</h2>
          <p className="body-6 muted">
            OpenReply is open source, and the code is free to use under its MIT
            license. The name and logo are separate from the code. You can say
            that you use OpenReply, that your project works with it, or that it
            is built on OpenReply. For anything unclear, email{" "}
            <a className="link-strong" href="mailto:diwennee@gmail.com">
              diwennee@gmail.com
            </a>
            .
          </p>
        </div>
        <div>
          <h2 className="heading-6">What is not allowed</h2>
          <ul className="brand-donts body-6 muted">
            <li>Using OpenReply as the name of your own product, service or domain.</li>
            <li>Implying that OpenReply made, sponsors or endorses your work.</li>
            <li>Stretching, recoloring, rotating or adding effects to the marks.</li>
          </ul>
        </div>
      </section>
    </SitePage>
  );
}
