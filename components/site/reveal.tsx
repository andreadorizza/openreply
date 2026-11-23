"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades and lifts its children into place once, the first time they scroll into view. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-in={shown}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** Large statement whose words light up one at a time as they cross a trigger line. */
export function TaglineReveal({ lines }: { lines: string[] }) {
  const root = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const words = Array.from(node.querySelectorAll<HTMLElement>("[data-word]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          // On once the word is above the trigger line, including after it has
          // scrolled off the top of the screen.
          el.dataset.on = String(
            entry.isIntersecting || entry.boundingClientRect.top < 0,
          );
        }
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    words.forEach((word) => observer.observe(word));
    return () => observer.disconnect();
  }, []);

  return (
    <p ref={root} className="tagline-text heading-2">
      {lines.map((line, lineIndex) => (
        <span key={line}>
          {line.split(" ").map((word, i) => (
            <span key={`${word}-${i}`}>
              <span className="tagline-word" data-word data-on="false">
                {word}
              </span>{" "}
            </span>
          ))}
          {lineIndex < lines.length - 1 && <br className="tagline-break" />}
        </span>
      ))}
    </p>
  );
}
