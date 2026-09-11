import { NextResponse } from 'next/server';
import { listAllVideos } from '@/lib/content/videos';
import { formatLastmod, normalizeEntryPath, xmlEscape, trimTo } from '../utils';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = false;

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();
const VIDEO_NAMESPACE = 'http://www.google.com/schemas/sitemap-video/1.1';

const buildVideoItems = async () => {
  const videos = await listAllVideos();
  return videos.map((video) => {
    // Published videos survive project unpublication. Only eligible public
    // projects receive a project destination; every other clip keeps its player URL.
    const loc = video.projectUri && !video.projectNoindex
      ? `${BASE}${normalizeEntryPath(video.projectUri)}`
      : `${BASE}/video-library?v=${encodeURIComponent(video.slug)}`;
    return {
      loc,
      lastmod: formatLastmod(video.modified) ?? formatLastmod(video.date),
      playerLoc: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
      thumbnailUrl: video.thumbnailUrl,
      title: video.title,
      description: trimTo(video.excerpt.trim() || video.title, 2048),
      // This optional date describes the original YouTube publication, not migration
      // time or the independently editable website chronology.
      publicationDate: formatLastmod(video.uploadDate),
      tags: [...new Set([
        ...video.categories.map((term) => term.name),
        ...video.materialTypes.map((term) => term.name),
        ...video.serviceAreas.map((term) => term.name),
      ])].slice(0, 32),
    };
  }).sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''));
};

export async function GET() {
  if (!SITEMAPS_ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await buildVideoItems();
  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="${VIDEO_NAMESPACE}">`,
    ...items.map((item) => {
      const lastmod = item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : '';
      const publication = item.publicationDate
        ? `<video:publication_date>${item.publicationDate}</video:publication_date>`
        : '';
      const tagsXml = item.tags
        .map((tag) => `<video:tag>${xmlEscape(tag)}</video:tag>`)
        .join('');

      return [
        `<url>`,
        `<loc>${xmlEscape(item.loc)}</loc>`,
        lastmod,
        `<video:video>`,
        `<video:thumbnail_loc>${xmlEscape(item.thumbnailUrl)}</video:thumbnail_loc>`,
        `<video:title>${xmlEscape(trimTo(item.title, 100))}</video:title>`,
        `<video:description>${xmlEscape(item.description)}</video:description>`,
        `<video:player_loc allow_embed="yes">${xmlEscape(item.playerLoc)}</video:player_loc>`,
        publication,
        `<video:family_friendly>yes</video:family_friendly>`,
        tagsXml,
        `</video:video>`,
        `</url>`,
      ].join('');
    }),
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...PREVIEW_HEADERS,
    },
  });
}
