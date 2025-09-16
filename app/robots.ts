import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NEXT_PUBLIC_ENV === 'production';
  if (!isProd) {
    return { rules: [{ userAgent: '*', disallow: '/' }], sitemap: [] };
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonshineroofing.com';
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: [`${base}/sitemap_index`] };
}
