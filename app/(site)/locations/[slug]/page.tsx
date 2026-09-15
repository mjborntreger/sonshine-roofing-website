import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocationBySlug, getLocationHubContent, listLocationSlugs, locationSnapshotId } from '@/lib/content/locations';
import { getServices, getSiteSettings } from '@/lib/content/directus-site';
import { buildBasicMetadata } from '@/lib/seo/meta';
import LocationHub from '@/components/location/LocationHub';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = false;

type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() {
  return (await listLocationSlugs()).map(slug => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLocationBySlug(slug);
  if (!page) notFound();
  const settings = await getSiteSettings();
  const og = page.ogImage ?? (settings?.defaultOgImage ? { url: settings.defaultOgImage.url, altText: settings.defaultOgImage.description, width: settings.defaultOgImage.width, height: settings.defaultOgImage.height } : null);
  return buildBasicMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/locations/${page.slug}`, keywords: page.focusKeywords, openGraphTitle: page.ogTitle ?? undefined, openGraphDescription: page.ogDescription ?? undefined,
    robots: { index: !page.noindex, follow: true }, image: og ? { url: og.url, alt: og.altText, width: og.width ?? undefined, height: og.height ?? undefined } : undefined });
}
export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  const content = await getLocationHubContent(slug);
  if (!content) notFound();
  const services = await getServices();
  return <div data-location-snapshot={locationSnapshotId()}><LocationHub {...content} services={services} /></div>;
}
