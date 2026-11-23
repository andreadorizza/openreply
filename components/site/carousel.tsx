"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * On phones the children become a swipeable row (see .carousel in site.css) and
 * dots appear below it. On larger screens it renders as it always did and the
 * dots are hidden. Children that are not displayed are left out of the dots.
 */
export function Carousel({
  className = "",
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const slides = () =>
      Array.from(node.children).filter(
        (child) => getComputedStyle(child).display !== "none",
      ) as HTMLElement[];

    const resize = new ResizeObserver(() => setCount(slides().length));
    resize.observe(node);

    const visible = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = slides().indexOf(entry.target as HTMLElement);
            if (index >= 0) setActive(index);
          }
        }
      },
      { root: node, threshold: 0.6 },
    );
    Array.from(node.children).forEach((child) => visible.observe(child));

    return () => {
      resize.disconnect();
      visible.disconnect();
    };
  }, []);

  function go(index: number) {
    const node = track.current;
    if (!node) return;
    const slides = Array.from(node.children).filter(
      (child) => getComputedStyle(child).display !== "none",
    ) as HTMLElement[];
    const target = slides[index];
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({
      left: target.offsetLeft - (node.clientWidth - target.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    <>
      <div ref={track} className={`carousel ${className}`}>
        {children}
      </div>
      <div className="carousel-dots" role="group" aria-label={label}>
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            className="carousel-dot"
            aria-label={`Show ${index + 1} of ${count}`}
            aria-current={index === active}
            onClick={() => go(index)}
          />
        ))}
      </div>
    </>
  );
}
