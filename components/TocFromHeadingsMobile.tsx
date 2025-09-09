'use client';

import { useEffect, useMemo, useState } from 'react';

type Item = { id: string; text: string; level: 2 | 3 };

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function TocFromHeadingsMobile({
  root = '#article-root',
  levels = ['h2', 'h3'] as const,
  className = '',
  title = 'On this page',
  /** px to offset scroll for sticky headers; set to 0 if headings use scroll-mt */
  offset = 0,
}: {
  root?: string;
  levels?: readonly ('h2' | 'h3')[];
  className?: string;
  title?: string;
  offset?: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const selector = Array.isArray(levels) ? levels.join(',') : 'h2,h3';

  // Collect headings and ensure they have stable ids
  useEffect(() => {
    const container = document.querySelector(root);
    if (!container) return;

    const ids = new Set<string>();
    const nodes = Array.from(container.querySelectorAll(selector)) as HTMLElement[];

    // Track when we should skip children of an excluded section
    let skipUntilLevel: 2 | 3 | null = null;
    const collected: Item[] = [];

    for (const heading of nodes) {
      // Ignore anything inside an explicitly excluded wrapper
      if (heading.closest('[data-toc-exclude]')) continue;

      const tag = heading.tagName;
      const level = tag === 'H2' ? 2 : tag === 'H3' ? 3 : null;
      if (level === null) continue;

      const text = (heading.textContent || '').trim();

      // If we're currently skipping children, ignore deeper headings
      if (skipUntilLevel !== null) {
        if (level > skipUntilLevel) continue;
        // we've reached a heading at the same or higher level; stop skipping
        skipUntilLevel = null;
      }

      // If this heading is the "You May Also Like" section, skip it and its children
      if (/^you may also like$/i.test(text)) {
        skipUntilLevel = level;
        continue;
      }

      // Ensure the element has a stable id
      let id = heading.id;
      if (!id) {
        const base = slugify(text);
        let candidate = base || 'section';
        let i = 2;
        while (ids.has(candidate) || document.getElementById(candidate)) {
          candidate = `${base}-${i++}`;
        }
        heading.id = candidate;
        id = candidate;
      }
      ids.add(id);

      collected.push({ id, text, level });
    }

    setItems(collected);
  }, [root, selector]);

  const list = useMemo(() => items, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (offset > 0) {
      const top = window.scrollY + el.getBoundingClientRect().top - offset;
      window.scrollTo({ top, behavior: prefersNoMotion ? 'auto' : 'smooth' });
    } else {
      el.scrollIntoView({ behavior: prefersNoMotion ? 'auto' : 'smooth', block: 'start' });
    }
    history.replaceState(null, '', `#${id}`);
  };

  if (!list.length) return null;

  return (
    <nav
      aria-label="Table of contents"
      className={[
        // Mobile-only by default; adjust breakpoint by overriding className if desired
        'md:hidden w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        className,
      ].join(' ')}
      data-mobile-toc
    >
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      <ul className="space-y-2 list-disc pl-5 text-sm">
        {list.map((i) => (
          <li key={i.id} className={i.level === 3 ? 'ml-3' : ''}>
            <a
              href={`#${i.id}`}
              onClick={(e) => handleClick(e, i.id)}
              className="block text-slate-700 hover:text-[#0045d7]"
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}