import 'server-only';
import { deployedEditorial } from './editorial';
import type { DirectusSponsorFeature, SponsorFeature } from './editorial-types';
export type { SponsorLinks, SponsorFeature } from './editorial-types';
async function listPublishedSponsorFeatures(): Promise<DirectusSponsorFeature[]> {
  return deployedEditorial().sponsors;
}
function dedupeSponsorFeatures(features: DirectusSponsorFeature[]): DirectusSponsorFeature[] {
  const seen = new Set<string>();
  return features.filter((feature) => {
    const key = feature.slug || feature.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toPublicSponsorFeature(feature: DirectusSponsorFeature): SponsorFeature {
  const { serviceAreaSlugs: _serviceAreaSlugs, ...publicFeature } = feature;
  return publicFeature;
}

export async function listSponsorFeaturesByServiceArea(
  serviceAreaSlugs: string[] | string | null | undefined,
  {
    primaryLimit = 8,
    fallbackLimit = 4,
    minimum = 4,
  }: {
    primaryLimit?: number;
    fallbackLimit?: number;
    minimum?: number;
  } = {},
): Promise<SponsorFeature[]> {
  const normalizedSlugs = (Array.isArray(serviceAreaSlugs) ? serviceAreaSlugs : [serviceAreaSlugs])
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
  const requestedSlugs = new Set(normalizedSlugs);
  const allFeatures = await listPublishedSponsorFeatures();
  const primary = requestedSlugs.size
    ? allFeatures
        .filter((feature) => feature.serviceAreaSlugs.some((slug) => requestedSlugs.has(slug)))
        .slice(0, primaryLimit)
    : [];

  if (primary.length >= minimum) return primary.map(toPublicSponsorFeature);

  const fallback = allFeatures.slice(0, Math.max(fallbackLimit, minimum));
  return dedupeSponsorFeatures([...primary, ...fallback]).map(toPublicSponsorFeature);
}
