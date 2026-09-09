'use client';

import { useMemo } from 'react';

import InfiniteList from '@/components/dynamic-content/InfiniteList';
import ResourceArchiveClient, {
  type FilterGroupConfig,
} from '@/components/dynamic-content/ResourceArchiveClient';
import type { ProjectSearchResult, TermLite } from '@/lib/content/project-types';

type FilterTerms = {
  materials: TermLite[];
  roofColors: TermLite[];
  serviceAreas: TermLite[];
};

type FiltersState = {
  search: string;
  materialTypeSlugs: string[];
  roofColorSlugs: string[];
  serviceAreaSlugs: string[];
};

type Props = {
  initialResult: ProjectSearchResult;
  filterTerms: FilterTerms;
  pageSize: number;
  initialFilters: FiltersState;
};

const buildProjectFilters = ({
  search,
  selections,
}: {
  search: string;
  selections: Record<string, string[]>;
}) => ({
  search: search || undefined,
  materialTypeSlugs: selections.material ?? [],
  roofColorSlugs: selections.roof ?? [],
  serviceAreaSlugs: selections.area ?? [],
});

export default function ProjectArchiveClient({
  initialResult,
  filterTerms,
  pageSize,
  initialFilters,
}: Props) {
  const groups = useMemo<FilterGroupConfig[]>(
    () => [
      {
        key: 'material',
        label: 'Material',
        paramKey: 'mt',
        options: filterTerms.materials.map((term) => ({ slug: term.slug, label: term.name })),
      },
      {
        key: 'roof',
        label: 'Color',
        paramKey: 'rc',
        options: filterTerms.roofColors
          .map((term) => ({ slug: term.slug, label: term.name }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      },
      {
        key: 'area',
        label: 'Location',
        paramKey: 'sa',
        options: filterTerms.serviceAreas
          .map((term) => ({ slug: term.slug, label: term.name }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      },
    ],
    [filterTerms],
  );

  return (
    <ResourceArchiveClient
      kind="project"
      apiPath="/api/resources/project"
      pageSize={pageSize}
      initialResult={initialResult}
      initialFilters={{
        search: initialFilters.search ?? '',
        selections: {
          material: initialFilters.materialTypeSlugs ?? [],
          roof: initialFilters.roofColorSlugs ?? [],
          area: initialFilters.serviceAreaSlugs ?? [],
        },
      }}
      groups={groups}
      labels={{ itemSingular: 'project', itemPlural: 'projects' }}
      buildFiltersPayload={buildProjectFilters}
      renderResults={({ result, listFilters, listKey }) => (
        <InfiniteList
          key={listKey}
          kind="project"
          initial={result}
          filters={listFilters}
          pageSize={pageSize}
          gridClass="mt-8"
          gridLayoutClassName="grid-cols-1 gap-6"
        />
      )}
    />
  );
}
