import type { ProjectFull, ProjectImage } from './project-types';
import type { SponsorFeature } from './sponsor-features';
import type { DirectusFaq } from './directus-faqs';
import type { NavItem } from '../routes';
import type { SiteSettings, ServiceSummary } from './directus-site';
import type { SpecialOfferPopupOffer } from '../../components/lead-capture/special-offer/SpecialOfferPopup';

export type ServiceArea = {
  id: string;
  clientSlug: string;
  name: string;
  slug: string;
  pageStatus: 'taxonomy_only' | 'draft' | 'published';
  href: string | null;
};

export type LocationPage = ServiceArea & {
  scopeKey: string;
  title: string;
  introduction: string;
  overviewHtml: string | null;
  mapImage: ProjectImage | null;
  publishedAt: string;
  modified: string | null;
  noindex: boolean;
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: ProjectImage | null;
};

export type GeographicRecord = {
  id: string;
  clientSlug: string;
  status: string;
  serviceAreaIds: string[];
  date?: string | null;
};

export type LocationProject = GeographicRecord & { project: ProjectFull };
export type LocationReview = GeographicRecord & {
  authorName: string;
  text: string;
  rating: number;
  url: string | null;
  areaName: string;
};
export type LocationSponsor = GeographicRecord & {
  sort: number;
  areaNames: string[];
  feature: SponsorFeature;
};
export type ImageAttribution = {
  title: string;
  creator: string;
  creatorUrl: string | null;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  changes: string | null;
};
export type NeighborhoodImage = ProjectImage & { attribution?: ImageAttribution | null };
export type LocationNeighborhood = {
  id: string;
  name: string;
  slug: string;
  serviceAreaId: string;
  description: string | null;
  landmarks: string | null;
  image: NeighborhoodImage | null;
  mapImage: ProjectImage | null;
  sort: number;
};
export type LocationGroups<T> = { local: T[]; nearby: T[] };
export type LocationSnapshot = {
  version: 1;
  contractVersion: 'location-v3';
  clientSlug: string;
  projectSnapshotHash: string;
  siteShell: { settings: SiteSettings; services: ServiceSummary[] };
  featuredOffer: SpecialOfferPopupOffer | null;
  areas: ServiceArea[];
  pages: LocationPage[];
  neighborhoods: LocationNeighborhood[];
  neighbors: { serviceAreaId: string; nearbyAreaId: string }[];
  reviews: LocationReview[];
  sponsors: LocationSponsor[];
  faqs: DirectusFaq[];
  navigation: NavItem[];
  coverage: { id: string; key: string; title: string; areaIds: string[] }[];
};
