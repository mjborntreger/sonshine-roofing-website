"use client";

import { Layers, MapPin, Palette } from "lucide-react";

import InfiniteList from "@/components/dynamic-content/InfiniteList";
import ResourceArchiveClient, {
  type FilterGroupConfig,
} from "@/components/dynamic-content/ResourceArchiveClient";
import type { ProjectSearchResult, TermLite } from "@/lib/content/wp";

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

export default function ProjectArchiveClient({ initialResult, filterTerms, pageSize, initialFilters }: Props) {
  const groups: FilterGroupConfig[] = [
    {
      key: "roof",
      label: "Roof Color",
      facet: "roof_color",
      paramKey: "rc",
      icon: Palette,
      options: filterTerms.roofColors.map((term) => ({ slug: term.slug, label: term.name })),
    },
    {
      key: "material",
      label: "Material",
      facet: "material_type",
      paramKey: "mt",
      icon: Layers,
      options: filterTerms.materials.map((term) => ({ slug: term.slug, label: term.name })),
    },
    {
      key: "area",
      label: "Service Area",
      facet: "service_area",
      paramKey: "sa",
      icon: MapPin,
      options: filterTerms.serviceAreas.map((term) => ({ slug: term.slug, label: term.name })),
    },
  ];

  return (
    <ResourceArchiveClient
      kind="project"
      title="Project Gallery"
      description="Explore our latest installs across Sarasota, Manatee, and Charlotte counties. Filter by material, roof color, and service area — or search by phrase to find a specific project."
      apiPath="/api/resources/project"
      pageSize={pageSize}
      initialResult={initialResult}
      initialFilters={{
        search: initialFilters.search ?? "",
        selections: {
          material: initialFilters.materialTypeSlugs ?? [],
          roof: initialFilters.roofColorSlugs ?? [],
          area: initialFilters.serviceAreaSlugs ?? [],
        },
      }}
      groups={groups}
      searchPlaceholder="Search projects..."
      labels={{ itemSingular: "project", itemPlural: "projects" }}
      emptyState={{
        title: "No results found.",
        description: {
          default: "Try clearing or adjusting your filters to see more projects.",
          withSearch: "Try clearing filters or searching for a different phrase.",
        },
        actionLabel: "Clear all filters",
      }}
      buildFiltersPayload={({ search, selections }) => ({
        search: search || undefined,
        materialTypeSlugs: selections.material ?? [],
        roofColorSlugs: selections.roof ?? [],
        serviceAreaSlugs: selections.area ?? [],
      })}
      renderResults={({ result, listFilters, listKey }) => (
        <InfiniteList
          key={listKey}
          kind="project"
          initial={result}
          filters={listFilters}
          pageSize={pageSize}
          gridClass="mt-8"
        />
      )}
      loadingOverlayMessage="Loading projects…"
    />
  );
}
