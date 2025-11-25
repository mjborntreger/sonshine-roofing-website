"use client";

import { useCallback, useRef } from "react";
import { Clapperboard, Layers, MapPin } from "lucide-react";

import ResourceArchiveClient, {
  type FilterGroupConfig,
} from "@/components/dynamic-content/ResourceArchiveClient";
import type { FacetGroup, TermLite, VideoItem } from "@/lib/content/wp";
import type { PageResult } from "@/lib/ui/pagination";

import VideoGrid from "./video-grid";

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

export default function VideoLibraryClient({
  initialResult,
  bucketOptions,
  materialOptions,
  serviceOptions,
  pageSize,
  initialFilters,
}: Props) {
  const forcedRoofingRef = useRef(false);

  const normalizeSelections = useCallback((input: Record<string, string[]>) => {
    const next: Record<string, string[]> = {};
    const keys = new Set([...Object.keys(input), "bucket", "material", "area"]);
    keys.forEach((key) => {
      next[key] = [...(input[key] ?? [])];
    });

    const hasMaterial = next.material?.length > 0;
    const hasArea = next.area?.length > 0;
    const shouldForceRoofing = Boolean(hasMaterial || hasArea);

    if (shouldForceRoofing) {
      forcedRoofingRef.current = true;
      if (next.bucket.length !== 1 || next.bucket[0] !== "roofing-project") {
        next.bucket = ["roofing-project"];
      }
    } else {
      const containsRoofing = next.bucket.includes("roofing-project");
      if (forcedRoofingRef.current) {
        forcedRoofingRef.current = false;
        if (containsRoofing && next.bucket.length === 1) {
          next.bucket = [];
        }
      }
      if (containsRoofing && next.bucket.length > 1) {
        next.bucket = ["roofing-project"];
      }
    }

    for (const key of Object.keys(next)) {
      next[key] = Array.from(new Set(next[key].map((value) => value.trim()).filter(Boolean)));
    }

    return next;
  }, []);

  const initialBucket = (() => {
    const base = initialFilters.bucketSlugs ?? [];
    const needsRoofing = (initialFilters.materialSlugs?.length ?? 0) > 0 || (initialFilters.serviceAreaSlugs?.length ?? 0) > 0;
    if (needsRoofing) return ["roofing-project"];
    return base;
  })();
  const groups: FilterGroupConfig[] = [
    {
      key: "bucket",
      label: "Video Type",
      facet: "bucket",
      paramKey: "bk",
      icon: Clapperboard,
      options: bucketOptions,
    },
    {
      key: "material",
      label: "Material",
      facet: "material_type",
      paramKey: "mt",
      icon: Layers,
      options: materialOptions.map((term) => ({ slug: term.slug.toLowerCase(), label: term.name })),
    },
    {
      key: "area",
      label: "Service Area",
      facet: "service_area",
      paramKey: "sa",
      icon: MapPin,
      options: serviceOptions.map((term) => ({ slug: term.slug.toLowerCase(), label: term.name })),
    },
  ];

  return (
    <ResourceArchiveClient
      kind="video"
      apiPath="/api/resources/video"
      pageSize={pageSize}
      initialResult={initialResult}
      initialFilters={{
        search: initialFilters.search ?? "",
        selections: {
          bucket: initialBucket,
          material: initialFilters.materialSlugs?.map((s) => s.toLowerCase()) ?? [],
          area: initialFilters.serviceAreaSlugs?.map((s) => s.toLowerCase()) ?? [],
        },
      }}
      groups={groups}
      labels={{ itemSingular: "video", itemPlural: "videos" }}
      emptyState={{
        title: "No results found.",
        description: {
          default: "Try clearing filters or adjusting your search to see more videos.",
          withSearch: "Try clearing filters or using a different phrase.",
        },
        actionLabel: "Clear filters",
      }}
      buildFiltersPayload={({ search, selections }) => {
        const payload: Record<string, unknown> = {};
        if (search) payload.q = search;
        if (selections.bucket && selections.bucket.length) payload.buckets = selections.bucket;
        if (selections.material && selections.material.length) payload.materialTypeSlugs = selections.material;
        if (selections.area && selections.area.length) payload.serviceAreaSlugs = selections.area;
        return payload;
      }}
      normalizeSelections={normalizeSelections}
      renderResults={({ result, listFilters, listKey }) => (
        <VideoGrid
          key={listKey}
          initial={result}
          filters={listFilters}
          pageSize={pageSize}
        />
      )}
      loadingOverlayMessage="Loading videos…"
    />
  );
}
