"use client";

import { useRef, useState, type ReactNode } from "react";
import { PlusIcon } from "./icons";

export interface FaqItem {
  q: string;
  a: ReactNode;
}

/**
 * One question open at a time. Opening a question closes the previous one and
 * eases the page so the new answer sits in the middle of the screen.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);

  function toggle(index: number) {
    if (open === index) {
      setOpen(null);
      return;
    }
    const item = itemRefs.current[index];
    const answer = answerRefs.current[index];
    const previous = open !== null ? answerRefs.current[open] : null;
    if (item && answer) {
      // Work out where the item will sit once the old answer has closed and the
      // new one has opened, then scroll straight there so the page does not
      // jump twice.
      const header = document.querySelector<HTMLElement>(".header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const shift = previous && open !== null && open < index ? previous.scrollHeight : 0;
      const question = item.firstElementChild as HTMLElement | null;
      const finalHeight = (question?.offsetHeight ?? 0) + answer.scrollHeight;
      const finalTop = item.getBoundingClientRect().top + window.scrollY - shift;
      const visibleCenter = headerHeight + (window.innerHeight - headerHeight) / 2;
      const target = finalTop + finalHeight / 2 - visibleCenter;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, target), behavior: reduce ? "auto" : "smooth" });
    }
    setOpen(index);
  }

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div
            key={item.q}
            className="faq-item"
            data-open={isOpen}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
          >
            <h3 className="faq-question">
              <button
                type="button"
                id={`faq-q-${index}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${index}`}
                onClick={() => toggle(index)}
                className="title-3"
              >
                {item.q}
                <PlusIcon />
              </button>
            </h3>
            <div
              id={`faq-a-${index}`}
              role="region"
              aria-labelledby={`faq-q-${index}`}
              className="faq-answer"
              inert={!isOpen}
            >
              <div
                ref={(node) => {
                  answerRefs.current[index] = node;
                }}
              >
                <p className="body-6">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
