'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectSummary } from '@/lib/wp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UiLink from '@/components/UiLink';
import Image from 'next/image';

const lessFatCta = 'btn btn-brand-blue btn-lg btn-press w-full sm:w-auto';
const gradientDivider = 'gradient-divider my-8';
const pStyles = 'my-8 text-center justify-center text-lg';

function ExcerptHTML({ html }: { html: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = html || '';
    }
  }, [html]);
  return (
    <p
      ref={ref}
      className="text-sm text-slate-600 line-clamp-3"
      suppressHydrationWarning
    />
  );
}

type MaterialKey = 'all' | 'shingle' | 'metal' | 'tile';

type Props = {
  /** Server-fetched list of recent projects (include materialTypes in wp.ts) */
  projects: ProjectSummary[];
  /** How many cards to show per filter */
  initial?: number;
  /** Show heading + CTA (defaults true) */
  showHeader?: boolean;
};

export default function LatestProjectsFilter({
  projects,
  initial = 4,
  showHeader = true,
}: Props) {
  const tabs: { key: MaterialKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'shingle', label: 'Shingle' },
    { key: 'metal', label: 'Metal' },
    { key: 'tile', label: 'Tile' },
  ];

  const [selected, setSelected] = useState<MaterialKey>('all');

  const filtered = useMemo(() => {
    if (!Array.isArray(projects)) return [] as ProjectSummary[];
    if (selected === 'all') return projects.slice(0, initial);
    const out: ProjectSummary[] = [];
    for (const p of projects) {
      const slugs = (p.materialTypes ?? []).map((t) => (t?.slug || '').toLowerCase());
      if (slugs.includes(selected)) out.push(p);
      if (out.length >= initial) break;
    }
    return out;
  }, [projects, selected, initial]);

  return (
    <div className="p-8 md:p-10 my-12">
      {showHeader && (
        <div className="text-center">
          <h2>Latest Projects</h2>
          <div className={gradientDivider} />

          <div className="flex flex-wrap items-center justify-center gap-2 my-6">
            {tabs.map((t) => {
              const active = t.key === selected;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelected(t.key)}
                  aria-pressed={active}
                  className={[
                    'rounded-full border px-4 py-2 text-sm transition',
                    active
                      ? 'bg-[var(--brand-blue)] text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <p className={pStyles}>
            Browse our latest projects and get an idea of what your new roof could look like.
          </p>
        </div>
      )}

      <div key={selected} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {filtered.length > 0 ? (
          filtered.map((p, i) => (
            <Card
              key={p.slug}
              className="overflow-hidden motion-safe:animate-lp-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
              data-card
            >
              <UiLink href={`/project/${p.slug}`} className="block" title={p.title}>
                <CardHeader>
                  <CardTitle className="font-medium line-clamp-2">{p.title}</CardTitle>
                </CardHeader>
                {p?.heroImage?.url ? (
                  <Image
                    src={p.heroImage.url}
                    alt={p.heroImage?.altText ?? p.title}
                    width={800}
                    height={600}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 w-full bg-slate-100" />
                )}
                <CardContent>
                  {(p as any)?.excerpt ? (
                    <ExcerptHTML html={(p as any).excerpt as string} />
                  ) : (
                    <p className="text-sm text-slate-600">Full Project Details →</p>
                  )}
                </CardContent>
              </UiLink>
            </Card>
          ))
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-medium">No matching projects</CardTitle>
            </CardHeader>
            <div className="h-48 w-full bg-slate-100" />
            <CardContent>
              <p className="text-sm text-slate-600">Try another filter.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {showHeader && (
        <div className="text-center mt-12">
          <UiLink href="/project" className={lessFatCta} title="See All Projects">
            See All Projects
          </UiLink>
        </div>
      )}
      <style jsx global>{`
        @keyframes lp-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        .animate-lp-fade-in { animation: lp-fade-in .28s ease-out both; }
        /* Tailwind variant friendly: use with motion-safe:animate-lp-fade-in */
      `}</style>
    </div>
  );
}