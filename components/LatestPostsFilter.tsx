"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BlogArchiveCard from "@/components/archive/BlogArchiveCard";
import FilterTabs from "@/components/project/FilterTabs";
import SmartLink from "./SmartLink";
import type { PostCard } from "@/lib/wp";
import {
  ArrowRight,
  GraduationCap,
  Newspaper,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

const lessFatCta = "btn btn-brand-blue btn-lg w-full sm:w-auto";
const gradientDivider = "gradient-divider my-8";
const pStyles = "my-8 text-center justify-center text-lg";

type CategoryKey = "all" | "education" | "hurricane-preparation" | "energy-efficient-roofing";

type Props = {
  /** Server-fetched list of recent posts (include categoryTerms in wp.ts) */
  posts: PostCard[];
  /** How many cards to show per filter */
  initial?: number;
  /** Show heading + CTA (defaults true) */
  showHeader?: boolean;
};

const TAB_CONFIG: Array<{
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "all", label: "All", icon: Newspaper },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "hurricane-preparation", label: "Hurricane Preparation", icon: Wind },
  { key: "energy-efficient-roofing", label: "Energy-Efficient Roofing", icon: Sun },
];

export default function LatestPostsFilter({ posts, initial = 4, showHeader = true }: Props) {
  const [selected, setSelected] = useState<CategoryKey>("all");

  const postsByCategory = useMemo(() => {
    const normalized = Array.isArray(posts) ? posts : [];
    const map: Record<CategoryKey, PostCard[]> = {
      all: normalized,
      education: [],
      "hurricane-preparation": [],
      "energy-efficient-roofing": [],
    };

    for (const post of normalized) {
      const slugs = ((post as any).categoryTerms ?? [])
        .map((t: any) => String(t?.slug ?? "").toLowerCase())
        .filter(Boolean);
      if (slugs.includes("education")) map.education.push(post);
      if (slugs.includes("hurricane-preparation")) map["hurricane-preparation"].push(post);
      if (slugs.includes("energy-efficient-roofing")) map["energy-efficient-roofing"].push(post);
    }

    return map;
  }, [posts]);

  const tabs = useMemo(
    () =>
      TAB_CONFIG.map((tab) => ({
        key: tab.key,
        label: tab.label,
        icon: tab.icon,
        terms: [],
        totalCount: postsByCategory[tab.key]?.length ?? 0,
        selectedCount: 0,
      })),
    [postsByCategory],
  );

  const filtered = useMemo(() => {
    const source = postsByCategory[selected] ?? [];
    return source.slice(0, initial);
  }, [postsByCategory, selected, initial]);

  const renderFilterTabs = () => (
    <div className={`flex justify-center ${showHeader ? "mt-6" : "mb-8"}`}>
      <FilterTabs
        tabs={tabs}
        activeKey={selected}
        onTabChange={(key) => setSelected(key as CategoryKey)}
        isLoading={false}
        ariaLabel="Latest blog filters"
      >
        {() => null}
      </FilterTabs>
    </div>
  );

  return (
    <div className="px-4 py-16 md:px-12 max-w-[1600px] mx-auto overflow-hidden">
      {showHeader ? (
        <div className="text-center">
          <h2 className="text-3xl text-slate-700 mb-16 md:text-5xl">Latest Blog Posts</h2>
          {renderFilterTabs()}
          <p className={pStyles}>
            Enjoy these handcrafted articles from our team that discuss a wide variety of roofing topics (and a few extras, from our family to yours).
          </p>
        </div>
      ) : (
        renderFilterTabs()
      )}

      <div key={selected} className="mt-8 grid gap-6 md:grid-cols-2">
        {filtered.length > 0 ? (
          filtered.map((post, index) => (
            <BlogArchiveCard
              key={post.slug ?? `${post.title}-${index}`}
              post={post}
              className="motion-safe:animate-lp-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
            />
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
        <div className="mt-12 text-center">
          <SmartLink
            href="/blog"
            className={lessFatCta}
            title="See All Blog Posts"
            data-icon-affordance="right"
          >
            See All Blog Posts
            <ArrowRight className="icon-affordance h-4 w-4 inline ml-2" />
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
  );
}
