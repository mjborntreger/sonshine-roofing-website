import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true';
  return isStaging
    ? { rules: [{ userAgent: '*', disallow: '/' }] }
    : { rules: [{ userAgent: '*', allow: '/' }], sitemap: 'https://sonshineroofing.com/sitemap.xml' };
}