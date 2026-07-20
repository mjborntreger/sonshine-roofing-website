import type { MetadataRoute } from 'next';
import { SITE_ORIGIN, isProdEnv } from '@/lib/seo/site';
import { getSiteSettings } from '@/lib/content/directus-site';

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isProdEnv()) {
    return { rules: [{ userAgent: '*', disallow: '/' }], sitemap: [] };
  }

  const settings = await getSiteSettings();
  const siteUrl = settings?.siteUrl ?? SITE_ORIGIN;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        ...(settings?.robotsDisallow.length ? { disallow: settings.robotsDisallow } : {}),
      },
    ],
    sitemap: [`${siteUrl}/sitemap_index`],
  };
}
