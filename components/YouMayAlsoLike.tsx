'use client';

import { useMemo } from 'react';
import BlogArchiveCard from '@/components/archive/BlogArchiveCard';
import type { PostCard } from '@/lib/wp';
import { ArrowRight, Sparkles } from 'lucide-react';
import UiLink from './UiLink';

const lessFatCta = "btn btn-brand-blue btn-lg w-full sm:w-auto";

// Minimal post shape expected from wp.ts
type YouMayAlsoLikePost = {
    slug: string;
    title: string;
    featuredImage?: { url: string; altText?: string | null } | null;
    categories?: { slug: string; name?: string | null }[] | null;
    date?: string | null; // ISO string optional; used for stable sorting if present
    excerpt?: string | null;
    contentPlain?: string | null;
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
        <section className={["mt-32 not-prose px-2", className].filter(Boolean).join(" ")} aria-labelledby="ymal-heading">
            <div className="flex justify-start mt-36 mb-12">
                <h2 
                    id="ymal-heading" 
                    className="text-3xl md:text-4xl">
                        <Sparkles className='inline h-7 w-7 md:h-10 md:w-10 text-[--brand-blue] mr-3' />
                        {heading}
                    </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {items.map((item, index) => {
                    const categories = (item.categories ?? [])
                        .map((category) => category?.name ?? category?.slug ?? '')
                        .filter(Boolean);

                    const postCard: PostCard = {
                        slug: item.slug,
                        title: item.title,
                        date: item.date ?? '',
                        categories,
                        featuredImage: item.featuredImage?.url
                            ? {
                                url: item.featuredImage.url,
                                altText: item.featuredImage.altText ?? null,
                            }
                            : undefined,
                        excerpt: item.excerpt ?? undefined,
                        contentPlain: item.contentPlain ?? undefined,
                    };

                    return (
                        <BlogArchiveCard
                            key={item.slug}
                            post={postCard}
                            className="motion-safe:animate-lp-fade-in"
                            style={{ animationDelay: `${index * 60}ms` }}
                        />
                    );
                })}
            </div>
            <div className="mt-12 text-center md:text-right">
                <UiLink href="/blog" className={lessFatCta} title="See All Blogs">
                    See All Blogs
                    <ArrowRight className="h-4 w-4 inline ml-2" />
                </UiLink>
            </div>

        </section>
    );
}
