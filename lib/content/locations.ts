import 'server-only';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readLocationSnapshot } from './location-data';
import { readProjectSnapshot } from './project-data';
import { selectLocationContent } from './location-selection';
import type { LocationProject, LocationSnapshot } from './location-types';

let snapshot: LocationSnapshot | undefined;
export function deployedLocations(): LocationSnapshot {
  snapshot ??= readLocationSnapshot(join(process.cwd(), '.generated/locations.json'), join(process.cwd(), '.generated/projects.json'));
  return snapshot;
}
export async function listLocationSlugs() { return deployedLocations().pages.map(page => page.slug); }
export function locationSnapshotId() { return createHash('sha256').update(JSON.stringify(deployedLocations())).digest('hex'); }
export async function getLocationBySlug(slug: string) { return deployedLocations().pages.find(page => page.slug === slug) ?? null; }
export async function listLocationSitemapEntries() { return deployedLocations().pages.filter(page => !page.noindex); }
export function listCoverageAreas() {
  const data = deployedLocations();
  const ids = [...new Set(data.coverage.flatMap(section => section.areaIds))];
  return ids.map(id => data.areas.find(area => area.id === id)!);
}

export async function getLocationHubContent(slug: string) {
  const data = deployedLocations();
  const page = data.pages.find(item => item.slug === slug);
  if (!page) return null;
  const projectSnapshot = readProjectSnapshot(join(process.cwd(), '.generated/projects.json'));
  const pool: LocationProject[] = projectSnapshot.projects.map(project => ({ id: project.id, clientSlug: projectSnapshot.clientSlug, status: 'published', serviceAreaIds: [project.serviceAreaId], date: project.date, project }));
  const selection = { areaId: page.id, clientSlug: data.clientSlug, nearbyAreaIds: data.neighbors.filter(pair => pair.serviceAreaId === page.id).map(pair => pair.nearbyAreaId) };
  return { page, projects: selectLocationContent(pool, { ...selection, kind: 'projects' }), reviews: selectLocationContent(data.reviews, { ...selection, kind: 'reviews' }), sponsors: selectLocationContent(data.sponsors, { ...selection, kind: 'sponsors' }),
    neighborhoods: data.neighborhoods.filter(item => item.serviceAreaId === page.id),
    neighborhoodProjects: pool.filter(item => item.serviceAreaIds.includes(page.id)),
    faqs: [...data.faqs.filter(faq => faq.serviceArea?.id === page.id),
      ...data.faqs.filter(faq => !faq.serviceArea && !faq.service && !faq.websitePage)] };
}
