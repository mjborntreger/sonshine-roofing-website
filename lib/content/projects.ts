import 'server-only';

import { join } from 'node:path';
import { readProjectSnapshot, queryProjectSnapshot, projectSummary } from './project-data';
import type { ProjectFull, ProjectSnapshot, ProjectsArchiveFilters } from './project-types';
import { extractYouTubeId, youtubeThumb, type VideoItem } from './wp';

export type { ProjectFull, ProjectSummary, ProjectTestimonial, ProjectsArchiveFilters, ProjectSearchResult, TermLite } from './project-types';

let snapshot: ProjectSnapshot | undefined;
function deployedProjects(): ProjectSnapshot {
  // This private artifact is generated before Next builds and travels with the
  // deployment. Runtime APIs never consult Directus or WordPress for projects.
  snapshot ??= readProjectSnapshot(join(process.cwd(), '.generated', 'projects.json'));
  return snapshot;
}

export async function listProjectsPaged(options: { first?: number; after?: string | null; filters?: ProjectsArchiveFilters } = {}) {
  return queryProjectSnapshot(deployedProjects(), options);
}

export async function listProjectSlugs(): Promise<string[]> {
  return deployedProjects().projects.map((project) => project.slug);
}

export async function getProjectBySlug(slug: string): Promise<ProjectFull | null> {
  return deployedProjects().projects.find((project) => project.slug === slug.trim()) ?? null;
}

export async function listProjectFilterTerms() {
  return deployedProjects().terms;
}

export async function listRecentProjectsPool(limit = 24) {
  return deployedProjects().projects.slice(0, limit).map(projectSummary);
}

export async function listRecentProjectsPoolForFilters(perType = 4, allCount = 8) {
  const all = deployedProjects().projects;
  const pool = [
    ...all.slice(0, allCount),
    ...['shingle', 'metal', 'tile'].flatMap((slug) => all.filter((project) => project.materialTypes.some((term) => term.slug === slug)).slice(0, perType)),
  ];
  return [...new Map(pool.map((project) => [project.slug, project])).values()].map(projectSummary);
}

export async function listRecentProjectsByServiceArea(serviceAreaSlug: string | string[] | null, limit = 4) {
  const slugs = (Array.isArray(serviceAreaSlug) ? serviceAreaSlug : [serviceAreaSlug]).map((slug) => slug?.trim().toLowerCase()).filter(Boolean);
  if (!slugs.length) return [];
  const all = deployedProjects().projects;
  const local = all.filter((project) => project.serviceAreas.some((term) => slugs.includes(term.slug))).slice(0, limit);
  const backfill = slugs.includes('sarasota') ? [] : all.filter((project) => project.serviceAreas.some((term) => term.slug === 'sarasota'));
  return [...new Map([...local, ...backfill].map((project) => [project.slug, project])).values()].slice(0, limit).map(projectSummary);
}

export async function listProjectSitemapEntries() {
  return deployedProjects().projects.filter((project) => !project.noindex);
}

export async function listProjectVideos(limit?: number): Promise<VideoItem[]> {
  const items = deployedProjects().projects.map(projectToVideoItem).filter((item): item is VideoItem => item !== null);
  return limit == null ? items : items.slice(0, limit);
}

export function projectToVideoItem(project: ProjectFull): VideoItem | null {
  const url = project.youtubeUrl?.trim();
  const youtubeId = url ? extractYouTubeId(url) : null;
  if (!url || !youtubeId) return null;
  return {
    id: `project-${project.slug}`, slug: project.slug, title: project.title,
    youtubeUrl: url, youtubeId, thumbnailUrl: youtubeThumb(youtubeId),
    source: 'project', date: project.date ?? undefined,
    excerpt: project.projectDescription, materialTypes: project.materialTypes, serviceAreas: project.serviceAreas,
    categories: [{ name: 'Roofing Projects', slug: 'roofing-project' }],
    featuredImage: project.heroImage ? { url: project.heroImage.url } : undefined,
    seo: project.seo,
  };
}
