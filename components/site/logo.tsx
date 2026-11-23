// The OpenReply mark: two circles with their overlap cut out. A small one sits
// at the top right of a larger one, the way OR is drawn in a set diagram: the
// post, and the reply.
const RING = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

export const LOGO_PATH = `${RING(26, 38, 24)}${RING(45, 21, 15)}`;
export const LOGO_VIEWBOX = "2 6 58 56";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path fillRule="evenodd" d={LOGO_PATH} />
    </svg>
  );
}
