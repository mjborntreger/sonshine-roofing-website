'use client';

import { useMemo } from 'react';

import InfiniteList from '../InfiniteList';
import ResourceArchiveClient, {
  type FilterGroupConfig,
} from '@/components/dynamic-content/ResourceArchiveClient';
import type { TermLite, FacetGroup } from '@/lib/content/wp';
import type { PageResult } from '@/lib/ui/pagination';
import type { PostCard } from '@/lib/content/wp';

type Props = {
  initialResult: PageResult<PostCard> & { facets?: FacetGroup[] };
  categories: TermLite[];
  pageSize: number;
  initialFilters: {
    search?: string;
    categorySlugs?: string[];
  };
};

const buildBlogFilters = ({
  search,
  selections,
}: {
  search: string;
  selections: Record<string, string[]>;
}) => ({
  search: search || undefined,
  categorySlugs: selections.category ?? [],
});

export default function BlogArchiveClient({
  initialResult,
  categories,
  pageSize,
  initialFilters,
}: Props) {
  const groups = useMemo<FilterGroupConfig[]>(
    () => [
      {
        key: 'category',
        label: 'Topic',
        paramKey: 'cat',
        options: categories
          .map((category) => ({ slug: category.slug, label: category.name }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      },
    ],
    [categories],
  );

  return (
    <ResourceArchiveClient
      kind="blog"
      apiPath="/api/resources/blog"
      pageSize={pageSize}
      initialResult={initialResult}
      initialFilters={{
        search: initialFilters.search ?? '',
        selections: { category: initialFilters.categorySlugs ?? [] },
      }}
      groups={groups}
      labels={{ itemSingular: 'post', itemPlural: 'posts' }}
      buildFiltersPayload={buildBlogFilters}
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
    />
  );
}
