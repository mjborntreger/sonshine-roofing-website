import type { ReactNode } from "react";
import LatestProjectsFilterClient from "./LatestProjectsFilter.client";
import ProjectArchiveCard from "@/components/dynamic-content/project/ProjectArchiveCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectSummary } from "@/lib/content/wp";
import {
  PROJECT_TAB_CONFIG,
  type MaterialKey,
} from "@/components/dynamic-content/latest-filters/latest-tab-config";
import {
  groupProjectsByMaterial,
  orderTabs,
} from "@/components/dynamic-content/latest-filters/latest-tab-utils";

type Props = {
  projects: ProjectSummary[];
  initial?: number;
  showHeader?: boolean;
};

type TabPayload = {
  key: MaterialKey;
  totalCount: number;
  slugs: string[];
};

type CardLookup = Record<string, ReactNode>;

const sectionDescription =
  "Browse our latest projects and get an idea of what your new roof could look like.";

function buildCardLookup(projects: ProjectSummary[]): CardLookup {
  return projects.reduce((acc, project) => {
    if (!project?.slug) return acc;
    acc[project.slug] = (
      <ProjectArchiveCard
        key={project.slug}
        project={project}
      />
    );
    return acc;
  }, {} as CardLookup);
}

function buildTabs(
  groups: Record<MaterialKey, ProjectSummary[]>,
  initial: number,
): TabPayload[] {
  const order = orderTabs(PROJECT_TAB_CONFIG);
  return order.map((key) => {
    const items = groups[key] ?? [];
    const trimmed = items.slice(0, Math.max(0, initial));
    return {
      key,
      totalCount: items.length,
      slugs: trimmed.map((project) => project.slug).filter(Boolean),
    };
  });
}

function buildEmptyState(): ReactNode {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="font-medium">No matching projects</CardTitle>
      </CardHeader>
      <div className="h-48 w-full bg-slate-100" />
      <CardContent>
        <p className="text-sm text-slate-600">Try another filter.</p>
      </CardContent>
    </Card>
  );
}

export default function LatestProjectsFilter({ projects, initial = 4, showHeader = true }: Props) {
  const groups = groupProjectsByMaterial(projects ?? []);
  const tabs = buildTabs(groups, initial);
  const cardLookup = buildCardLookup(projects ?? []);
  const emptyState = buildEmptyState();

  const initialKey =
    tabs.find((tab) => tab.slugs.length > 0)?.key ?? orderTabs(PROJECT_TAB_CONFIG)[0];

  return (
    <LatestProjectsFilterClient
      showHeader={showHeader}
      description={sectionDescription}
      ctaHref="/project"
      ctaLabel="See All Projects"
      tabs={tabs}
      initialKey={initialKey}
      cardLookup={cardLookup}
      emptyState={emptyState}
    />
  );
}
