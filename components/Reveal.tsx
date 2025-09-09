// components/Reveal.tsx
'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  /** Render as a different tag (e.g., 'li', 'section', 'article') */
  as?: keyof JSX.IntrinsicElements;
  /** ms before animation starts */
  delay?: number;
  /** IntersectionObserver threshold (0..1) */
  threshold?: number;
  /** Observer root margin (e.g., '0px 0px -10% 0px') */
  rootMargin?: string;
  /** Animate only once (disconnect after first reveal) */
  once?: boolean;
};

export default function Reveal({
  as = 'div',
  delay = 0,
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
  once = true,
  className,
  children,
  ...rest
}: Props) {
  const Tag = as as any;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let revealed = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          if (!revealed) {
            el.style.animationDelay = `${delay}ms`;
            el.classList.add('animate-fade-in'); // tailwind.config.ts defines this keyframe
            revealed = true;
            if (once) io.disconnect();
          }
        } else if (!once) {
          // allow re-trigger
          el.classList.remove('animate-fade-in');
          revealed = false;
        }
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay, threshold, rootMargin, once]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}