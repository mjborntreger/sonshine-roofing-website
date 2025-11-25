"use client";

import { BookOpen } from "lucide-react";

import InfiniteList from "../InfiniteList";
import ResourceArchiveClient, {
  type FilterGroupConfig,
} from "@/components/dynamic-content/ResourceArchiveClient";
import type { TermLite, FacetGroup } from "@/lib/content/wp";
import type { PageResult } from "@/lib/ui/pagination";
import type { PostCard } from "@/lib/content/wp";

type Props = {
  initialResult: PageResult<PostCard> & { facets?: FacetGroup[] };
  categories: TermLite[];
  pageSize: number;
  initialFilters: {
    search?: string;
    categorySlugs?: string[];
  };
};

export default function BlogArchiveClient({ initialResult, categories, pageSize, initialFilters }: Props) {
  const groups: FilterGroupConfig[] = [
    {
      key: "category",
      label: "Categories",
      facet: "category",
      paramKey: "cat",
      icon: BookOpen,
      options: categories.map((cat) => ({ slug: cat.slug, label: cat.name })),
    },
  ];

  return (
    <ResourceArchiveClient
      kind="blog"
      apiPath="/api/resources/blog"
      pageSize={pageSize}
      initialResult={initialResult}
      initialFilters={{
        search: initialFilters.search ?? "",
        selections: { category: initialFilters.categorySlugs ?? [] },
      }}
      groups={groups}
      labels={{ itemSingular: "post", itemPlural: "posts" }}
      emptyState={{
        title: "No results found.",
        description: {
          default: "Try clearing filters or adjusting your search terms.",
          withSearch: "Try clearing filters or using a different phrase.",
        },
        actionLabel: "Clear filters",
      }}
      minSearchLength={2}
      buildFiltersPayload={({ search, selections }) => ({
        search: search || undefined,
        categorySlugs: selections.category ?? [],
      })}
      renderResults={({ result, listFilters, listKey }) => (
        <InfiniteList
          key={listKey}
          kind="blog"
          initial={result}
          filters={listFilters}
          pageSize={pageSize}
          gridClass="mt-8"
        />
      )}
      loadingOverlayMessage="Loading posts…"
    />
  );
}
