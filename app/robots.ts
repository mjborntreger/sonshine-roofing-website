import type { MetadataRoute } from 'next';
import { SITE_ORIGIN, isProdEnv } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  if (!isProdEnv()) {
    return { rules: [{ userAgent: '*', disallow: '/' }], sitemap: [] };
  }
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: [`${SITE_ORIGIN}/sitemap_index`] };
}
