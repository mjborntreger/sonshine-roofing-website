'use client';

import { useEffect, useMemo, useState } from 'react';

type Item = { id: string; text: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function TocFromHeadings({
  root = '#article-root',
  className = 'text-sm',
  /** px to offset scroll for sticky headers; use 0 if headings already have scroll-mt */
  offset = 0,
}: {
  root?: string; // CSS selector for the article container
  className?: string;
  offset?: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Collect only H2 headings and ensure they have stable ids
  useEffect(() => {
    const container = document.querySelector(root);
    if (!container) return;

    const ids = new Set<string>();

    type Scanned = Item & {
      el: HTMLElement;
      excludedByContainer: boolean; // inside [data-toc-exclude] or .toc-exclude
      excludedByName: boolean; // literal heading text to skip (e.g., You May Also Like)
    };

    const scanned = Array.from(container.querySelectorAll('h2'))
      .map((el): Scanned | null => {
        const heading = el as HTMLElement;
        const text = (heading.textContent || '').trim();

        // Ensure a stable id
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

        const excludedByContainer = !!heading.closest('[data-toc-exclude], .toc-exclude');
        const excludedByName = /^you\s+may\s+also\s+like$/i.test(text);

        return { id, text, el: heading, excludedByContainer, excludedByName };
      })
      .filter(Boolean) as Scanned[];

    const found: Item[] = [];
    for (const it of scanned) {
      if (it.excludedByContainer || it.excludedByName) continue;
      found.push({ id: it.id, text: it.text });
    }

    setItems((prev) => {
      if (
        prev.length === found.length &&
        prev.every((p, i) => p.id === found[i].id && p.text === found[i].text)
      ) {
        return prev;
      }
      return found;
    });
  }, [root]);

  // Scroll-driven active heading
  useEffect(() => {
    const container = document.querySelector(root);
    if (!container) return;
    const headings = Array.from(container.querySelectorAll('h2')) as HTMLElement[];
    if (!headings.length) return;

    const thr = 2; // px cushion so we don't flicker at exact boundary

    const getActive = () => {
      const adj = offset || 0;
      // Choose the last heading whose top (minus offset) is above the viewport top
      let currentId = headings[0].id;
      for (let i = 0; i < headings.length; i++) {
        const t = headings[i].getBoundingClientRect().top - adj;
        if (t <= thr) currentId = headings[i].id; else break;
      }
      return currentId;
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setActiveId(getActive());
      });
    };

    // Initial state (respect hash if present)
    if (location.hash) {
      setActiveId(location.hash.slice(1));
    } else {
      setActiveId(getActive());
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [root, offset, items.length]);

  const list = useMemo(() => items, [items]);

  if (!list.length) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    // Smooth-scroll; respect prefers-reduced-motion
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
    // Update hash without big jump
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav
      aria-label="Table of contents"
      className={['rounded-2xl border border-slate-300 bg-white p-4 shadow-sm mt-4', className].join(' ')}
    >
      <div className="mb-3 text-xs text-center font-semibold text-slate-900">ON THIS PAGE</div>
      <ul className="space-y-2 text-sm">
        {list.map((i) => {
          const active = i.id === activeId;
          return (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                onClick={(e) => handleClick(e, i.id)}
                aria-current={active ? 'true' : undefined}
                className={[
                  'block hover:text-[--brand-blue] transition-colors',
                  active ? 'text-[--brand-blue] font-medium' : 'text-slate-700',
                ].join(' ')}
              >
                {i.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}