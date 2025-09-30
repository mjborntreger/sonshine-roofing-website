"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProjectArchiveCard from "@/components/archive/ProjectArchiveCard";
import FilterTabs from "@/components/project/FilterTabs";
import UiLink from "@/components/UiLink";
import type { ProjectSummary } from "@/lib/wp";
import {
  ArrowRight,
  Grid3x3,
  Hammer,
  Layers,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const lessFatCta = "btn btn-brand-blue btn-lg w-full sm:w-auto";
const gradientDivider = "gradient-divider my-8";
const pStyles = "my-8 text-center justify-center text-lg";

type MaterialKey = "all" | "shingle" | "metal" | "tile";

type Props = {
  /** Server-fetched list of recent projects (include materialTypes in wp.ts) */
  projects: ProjectSummary[];
  /** How many cards to show per filter */
  initial?: number;
  /** Show heading + CTA (defaults true) */
  showHeader?: boolean;
};

const TAB_CONFIG: Array<{
  key: MaterialKey;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "all", label: "All", icon: Layers },
  { key: "shingle", label: "Shingle", icon: Hammer },
  { key: "metal", label: "Metal", icon: Wrench },
  { key: "tile", label: "Tile", icon: Grid3x3 },
];

export default function LatestProjectsFilter({ projects, initial = 4, showHeader = true }: Props) {
  const [selected, setSelected] = useState<MaterialKey>("all");

  const projectsByMaterial = useMemo(() => {
    const normalized = Array.isArray(projects) ? projects : [];
    const map: Record<MaterialKey, ProjectSummary[]> = {
      all: normalized,
      shingle: [],
      metal: [],
      tile: [],
    };

    for (const project of normalized) {
      const slugs = (project.materialTypes ?? [])
        .map((term) => String(term?.slug ?? "").toLowerCase())
        .filter(Boolean);
      if (slugs.includes("shingle")) map.shingle.push(project);
      if (slugs.includes("metal")) map.metal.push(project);
      if (slugs.includes("tile")) map.tile.push(project);
    }

    return map;
  }, [projects]);

  const tabs = useMemo(
    () =>
      TAB_CONFIG.map((tab) => ({
        key: tab.key,
        label: tab.label,
        icon: tab.icon,
        terms: [],
        totalCount: projectsByMaterial[tab.key]?.length ?? 0,
        selectedCount: 0,
      })),
    [projectsByMaterial],
  );

  const filtered = useMemo(() => {
    const source = projectsByMaterial[selected] ?? [];
    return source.slice(0, initial);
  }, [projectsByMaterial, selected, initial]);

  const renderFilterTabs = () => (
    <div className={`flex justify-center ${showHeader ? "mt-6" : "mb-8"}`}>
      <FilterTabs
        tabs={tabs}
        activeKey={selected}
        onTabChange={(key) => setSelected(key as MaterialKey)}
        isLoading={false}
        ariaLabel="Latest project filters"
      >
        {() => null}
      </FilterTabs>
    </div>
  );

  return (
    <div className="px-4 py-24 md:px-12">
      {showHeader ? (
        <div className="text-center">
          <h2 className="text-3xl mb-16 text-slate-700 md:text-5xl">Latest Projects</h2>
          {renderFilterTabs()}
          <p className={pStyles}>
            Browse our latest projects and get an idea of what your new roof could look like.
          </p>
        </div>
      ) : (
        renderFilterTabs()
      )}

      <div key={selected} className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filtered.length > 0 ? (
          filtered.map((project, index) => (
            <ProjectArchiveCard
              key={project.slug ?? `${project.title}-${index}`}
              project={project}
              className="motion-safe:animate-lp-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
            />
          ))
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-medium">No matching projects</CardTitle>
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
          <UiLink
            href="/project"
            className={lessFatCta}
            title="See All Projects"
            data-icon-affordance="right"
          >
            See All Projects
            <ArrowRight className="icon-affordance h-4 w-4 inline ml-2" />
          </UiLink>
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
