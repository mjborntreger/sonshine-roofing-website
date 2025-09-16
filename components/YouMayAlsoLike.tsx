'use client';

import { useMemo } from 'react';
import UiLink from '@/components/UiLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

// Minimal post shape expected from wp.ts
export type YouMayAlsoLikePost = {
    slug: string;
    title: string;
    featuredImage?: { url: string; altText?: string | null } | null;
    categories?: { slug: string; name?: string | null }[] | null;
    date?: string | null; // ISO string optional; used for stable sorting if present
};

type Props = {
    /** Pool of recent posts fetched on the server (should include categories). */
    posts: YouMayAlsoLikePost[];
    /** Target category slug to prioritize (e.g., 'roof-repair'). Can be any valid category. */
    category?: string;
    /** Exclude a specific slug (e.g., current post). */
    excludeSlug?: string;
    /** Number of cards to show (default 4). */
    limit?: number;
    /** Optional wrapper className */
    className?: string;
    /** Optional custom heading (defaults to "You May Also Like") */
    heading?: string;
};

export default function YouMayAlsoLike({
    posts,
    category,
    excludeSlug,
    limit = 4,
    className,
    heading = 'You May Also Like',
}: Props) {
    const items = useMemo(() => {
        if (!Array.isArray(posts) || posts.length === 0) return [] as YouMayAlsoLikePost[];

        // Normalize + sort newest first if date exists (else keep given order)
        const normalized = posts
            .filter((p) => p && typeof p.slug === 'string' && p.slug !== excludeSlug)
            .slice();

        normalized.sort((a, b) => {
            const ad = a.date ? Date.parse(a.date) : 0;
            const bd = b.date ? Date.parse(b.date) : 0;
            return bd - ad; // newest first
        });

        const pick: YouMayAlsoLikePost[] = [];
        const seen = new Set<string>();

        const push = (p: YouMayAlsoLikePost) => {
            if (seen.has(p.slug)) return;
            seen.add(p.slug);
            pick.push(p);
        };

        // 1) Priority: posts that include the requested category
        if (category) {
            const cat = category.toLowerCase();
            for (const p of normalized) {
                const slugs = (p.categories ?? []).map((c) => (c?.slug || '').toLowerCase());
                if (slugs.includes(cat)) push(p);
                if (pick.length >= limit) break;
            }
        }

        // 2) Backfill: newest from any category (excluding already chosen and excluded)
        if (pick.length < limit) {
            for (const p of normalized) {
                if (pick.length >= limit) break;
                push(p);
            }
        }

        return pick.slice(0, limit);
    }, [posts, category, excludeSlug, limit]);

    if (!items.length) return null;

    return (
        <section className={["not-prose px-2", className].filter(Boolean).join(" ")} aria-labelledby="ymal-heading">
            <div className="text-center">
                <h2 id="ymal-heading" className="my-8">{heading}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {items.map((p) => (
                    <Card key={p.slug} className="overflow-hidden hover:shadow-lg transition [&_img]:rounded-none">
                        <UiLink href={`/${p.slug}`} className="block" title={p.title} aria-label={`Read ${p.title}`}>
                            <CardHeader>
                                <CardTitle className="font-medium line-clamp-2">{p.title}</CardTitle>
                            </CardHeader>

                            {/* Image */}
                            {p.featuredImage?.url ? (
                                <Image
                                    src={p.featuredImage.url}
                                    alt={p.featuredImage.altText || p.title}
                                    width={800}
                                    height={600}
                                    sizes="(max-width: 800px) 80vw, 768px"
                                    className="h-48 w-full object-cover rounded-none"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="h-48 w-full bg-slate-100" />
                            )}

                            <CardContent>
                                <span className="inline-flex items-center gap-1 text-[15px] text-slate-700">
                                    Read more <span aria-hidden>→</span>
                                </span>
                            </CardContent>
                        </UiLink>
                    </Card>
                ))}
            </div>
        </section>
    );
}