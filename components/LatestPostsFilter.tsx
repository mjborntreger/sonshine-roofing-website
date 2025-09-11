'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import type { PostCard } from '@/lib/wp';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SmartLink from './SmartLink';

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

type CategoryKey = 'all' | 'education' | 'hurricane-preparation' | 'energy-efficient-roofing';

type Props = {
  /** Server-fetched list of recent posts (include categoryTerms in wp.ts) */
  posts: PostCard[];
  /** How many cards to show per filter */
  initial?: number;
  /** Show heading + CTA (defaults true) */
  showHeader?: boolean;
};

export default function LatestPostsFilter({
  posts,
  initial = 4,
  showHeader = true,
}: Props) {
  const tabs: { key: CategoryKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'education', label: 'Education' },
    { key: 'hurricane-preparation', label: 'Hurricane Preparation' },
    { key: 'energy-efficient-roofing', label: 'Energy-Efficient Roofing' },
  ];

  const [selected, setSelected] = useState<CategoryKey>('all');

  const filtered = useMemo(() => {
    if (!Array.isArray(posts)) return [] as PostCard[];
    if (selected === 'all') return posts.slice(0, initial);
    const out: PostCard[] = [];
    for (const p of posts) {
      const slugs = ((p as any).categoryTerms ?? []).map((t: any) => (t?.slug || '').toLowerCase());
      if (slugs.includes(selected)) out.push(p);
      if (out.length >= initial) break;
    }
    return out;
  }, [posts, selected, initial]);

  return (
    <>
    <div className="px-8 md:px-10 py-24">
      {showHeader && (
        <div className="text-center">
          <h2 className="text-3xl text-slate-700 md:text-5xl">Latest Blog Posts</h2>
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
            Enjoy these handcrafted articles from our team that discuss a wide variety of roofing topics (and a few extras, from our family to yours).
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
              <SmartLink href={`/${p.slug}`} className="block" title={p.title}>
                <CardHeader>
                  <CardTitle className="font-medium line-clamp-2">{p.title}</CardTitle>
                </CardHeader>
                {(p as any)?.featuredImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(p as any).featuredImage.url}
                    alt={(p as any)?.featuredImage?.altText ?? p.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 w-full bg-slate-100" />
                )}
                <CardContent>
                  {(p as any)?.excerpt ? (
                    <ExcerptHTML html={(p as any).excerpt as string} />
                  ) : (
                    <p className="text-sm text-slate-600">Read more →</p>
                  )}
                </CardContent>
              </SmartLink>
            </Card>
          ))
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-medium">No matching posts</CardTitle>
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
          <SmartLink href="/blog" className={lessFatCta} title="See All Blog Posts">
            See All Blog Posts
          </SmartLink>
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
  </>
  );
}
