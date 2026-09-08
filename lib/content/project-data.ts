import { readFileSync } from 'node:fs';
import type { ProjectFull, ProjectSnapshot, ProjectSummary, ProjectsArchiveFilters, ProjectSearchResult } from './project-types';

export function readProjectSnapshot(filename: string): ProjectSnapshot {
  let snapshot: ProjectSnapshot;
  try {
    snapshot = JSON.parse(readFileSync(filename, 'utf8')) as ProjectSnapshot;
  } catch {
    throw new Error('Project snapshot is unavailable. Run the credentialed prebuild before starting the frontend.');
  }
  if (snapshot.version !== 1 || !snapshot.clientSlug || !Array.isArray(snapshot.projects) || !snapshot.projects.length || !snapshot.terms) {
    throw new Error('Project snapshot is invalid. Regenerate it with the credentialed prebuild.');
  }
  return snapshot;
}

export function projectSummary(project: ProjectSummary): ProjectSummary {
  const { slug, uri, title, year, date, heroImage, projectDescription, reviewSnippet, reviewAuthorName, materialTypes, roofColors, serviceAreas } = project;
  return { slug, uri, title, year, date, heroImage, projectDescription, reviewSnippet, reviewAuthorName, materialTypes, roofColors, serviceAreas };
}

export function queryProjectSnapshot(snapshot: ProjectSnapshot, {
  first = 24, after = null, filters = {},
}: { first?: number; after?: string | null; filters?: ProjectsArchiveFilters } = {}): ProjectSearchResult {
  const size = Number.isFinite(first) ? Math.max(1, Math.min(Math.floor(first), 50)) : 24;
  const offset = after && /^\d+$/u.test(after) ? Number(after) : 0;
  const search = (filters.search ?? '').trim().toLocaleLowerCase('en-US');
  const dimensions = [
    { key: 'materialTypes', filter: 'materialTypeSlugs', taxonomy: 'material_type', terms: snapshot.terms.materials },
    { key: 'roofColors', filter: 'roofColorSlugs', taxonomy: 'roof_color', terms: snapshot.terms.roofColors },
    { key: 'serviceAreas', filter: 'serviceAreaSlugs', taxonomy: 'service_area', terms: snapshot.terms.serviceAreas },
  ] as const;
  const matches = (project: ProjectFull) => {
    const searchable = `${project.title} ${project.contentPlain}`.toLocaleLowerCase('en-US');
    if (search && !searchable.includes(search)) return false;
    return dimensions.every(({ key, filter }) => {
      const selected = filters[filter]?.map((slug) => slug.trim().toLowerCase()).filter(Boolean) ?? [];
      return !selected.length || (project[key] ?? []).some((term) => selected.includes(term.slug));
    });
  };
  const filtered = snapshot.projects.filter((project) => matches(project));
  const end = Math.min(offset + size, filtered.length);
  return {
    items: filtered.slice(offset, end).map(projectSummary),
    pageInfo: { hasNextPage: end < filtered.length, endCursor: end < filtered.length ? String(end) : null },
    total: filtered.length,
    facets: dimensions.map(({ key, taxonomy, terms }) => {
      const counts = new Map<string, number>();
      for (const project of filtered) {
        for (const term of project[key] ?? []) counts.set(term.slug, (counts.get(term.slug) ?? 0) + 1);
      }
      return { taxonomy, buckets: terms.map((term) => ({ ...term, count: counts.get(term.slug) ?? 0 })) };
    }),
    meta: { overallTotal: filtered.length, fullTotal: snapshot.projects.length },
  };
}
