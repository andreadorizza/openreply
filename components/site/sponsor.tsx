import Image from "next/image";
import { zernioLink } from "@/lib/zernio-links";

export function SponsorCredit({ placement }: { placement: string }) {
  return (
    <a
      className="sponsor caption-5"
      href={zernioLink({ placement })}
      target="_blank"
      rel="sponsored noopener noreferrer"
    >
      <span>Supported by</span>
      <span className="sponsor-logo">
        <Image
          src="/brand/zernio-primary.svg"
          alt="Zernio"
          width={76}
          height={24}
        />
      </span>
    </a>
  );
}
