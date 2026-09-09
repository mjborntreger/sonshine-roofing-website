'use client';

import { useMemo } from 'react';

import ResourceArchiveClient, {
  type FilterGroupConfig,
} from '@/components/dynamic-content/ResourceArchiveClient';
import type { FacetGroup, TermLite, VideoItem } from '@/lib/content/wp';
import type { PageResult } from '@/lib/ui/pagination';

import VideoGrid from './video-grid';

type Props = {
  initialResult: PageResult<VideoItem> & { facets?: FacetGroup[] };
  bucketOptions: Array<{ slug: string; label: string }>;
  materialOptions: TermLite[];
  serviceOptions: TermLite[];
  pageSize: number;
  initialFilters: {
    search?: string;
    bucketSlugs?: string[];
    materialSlugs?: string[];
    serviceAreaSlugs?: string[];
  };
};

const buildVideoFilters = ({
  search,
  selections,
}: {
  search: string;
  selections: Record<string, string[]>;
}) => ({
  q: search || undefined,
  buckets: selections.bucket ?? [],
  materialTypeSlugs: selections.material ?? [],
  serviceAreaSlugs: selections.area ?? [],
});

export default function VideoLibraryClient({
  initialResult,
  bucketOptions,
  materialOptions,
  serviceOptions,
  pageSize,
  initialFilters,
}: Props) {
  const groups = useMemo<FilterGroupConfig[]>(
    () => [
      { key: 'bucket', label: 'Video Type', paramKey: 'bk', options: bucketOptions },
      {
        key: 'material',
        label: 'Material',
        paramKey: 'mt',
        options: materialOptions.map((term) => ({
          slug: term.slug.toLowerCase(),
          label: term.name,
        })),
        enabledWhen: { key: 'bucket', values: ['', 'roofing-project'] },
      },
      {
        key: 'area',
        label: 'Location',
        paramKey: 'sa',
        options: serviceOptions
          .map((term) => ({ slug: term.slug.toLowerCase(), label: term.name }))
          .sort((a, b) => a.label.localeCompare(b.label)),
        enabledWhen: { key: 'bucket', values: ['', 'roofing-project'] },
      },
    ],
    [bucketOptions, materialOptions, serviceOptions],
  );

  return (
    <ResourceArchiveClient
      kind="video"
      apiPath="/api/resources/video"
      pageSize={pageSize}
      initialResult={initialResult}
      initialFilters={{
        search: initialFilters.search ?? '',
        selections: {
          bucket: initialFilters.bucketSlugs ?? [],
          material: initialFilters.materialSlugs?.map((s) => s.toLowerCase()) ?? [],
          area: initialFilters.serviceAreaSlugs?.map((s) => s.toLowerCase()) ?? [],
        },
      }}
      groups={groups}
      labels={{ itemSingular: 'video', itemPlural: 'videos' }}
      buildFiltersPayload={buildVideoFilters}
      renderResults={({ result, listFilters, listKey }) => (
        <VideoGrid initial={result} filters={listFilters} pageSize={pageSize} listKey={listKey} />
      )}
    />
  );
}
