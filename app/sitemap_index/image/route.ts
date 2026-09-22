import { NextResponse } from 'next/server';
import { listLocationSitemapEntries, deployedLocations } from '@/lib/content/locations';
import { listBlogImageSitemapEntries } from '@/lib/content/blog';
import { listProjectSitemapEntries } from '@/lib/content/projects';
import { listPersonSitemapEntries } from '@/lib/content/persons';
import { formatLastmod, normalizeEntryPath } from '../utils';
import { serializeImageEntry, type ImageSitemapEntry } from './serialization';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = false;

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();



const buildImageEntries = async (): Promise<ImageSitemapEntry[]> => {
  const [blogNodes, projectNodes, locationNodes, personNodes] = await Promise.all([
    listBlogImageSitemapEntries(),
    listProjectSitemapEntries(),
    listLocationSitemapEntries(),
    listPersonSitemapEntries(),
  ]);

  const entries: ImageSitemapEntry[] = [];

  for (const node of blogNodes) {
    const path = normalizeEntryPath(node.uri);
    if (path === '/') continue;
    const images = node.featuredImage ? [node.featuredImage] : [];
    if (!images.length) continue;
    entries.push({
      loc: path,
      lastmod: formatLastmod(node.modified),
      images,
    });
  }

  for (const node of projectNodes) {
    const path = normalizeEntryPath(node.uri ?? '');
    if (path === '/') continue;
    const images = [...(node.heroImage ? [node.heroImage] : []), ...node.projectImages];
    if (!images.length) continue;
    entries.push({
      loc: path,
      lastmod: formatLastmod(node.modified),
      images,
    });
  }

  for (const node of locationNodes) {
    const images = [...(node.mapImage ? [node.mapImage] : []), ...deployedLocations().neighborhoods.filter(item => item.serviceAreaId === node.id).flatMap(item => [item.image, item.mapImage].filter(image => image !== null))];
    if (images.length) entries.push({ loc: `/locations/${node.slug}`, lastmod: formatLastmod(node.modified), images });
  }

  for (const person of personNodes) {
    const path = normalizeEntryPath(person.uri);
    if (path === '/') continue;
    const images = person.featuredImage ? [person.featuredImage] : [];
    if (!images.length) continue;
    entries.push({
      loc: path,
      lastmod: formatLastmod(person.modified),
      images,
    });
  }

  return entries.sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''));
};

export async function GET() {
  if (!SITEMAPS_ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const entries = await buildImageEntries();

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');

  const urls = entries
    .map((entry) => serializeImageEntry(BASE, entry))
    .filter((entry): entry is string => Boolean(entry));

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...urls,
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...PREVIEW_HEADERS,
    },
  });
}
