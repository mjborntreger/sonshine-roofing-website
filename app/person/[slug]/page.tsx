import { listPersonsBySlug, listPersons, listPersonsBySlugs } from "@/lib/wp";
import type { Metadata } from 'next';
import Image from "next/image";
import Section from "@/components/layout/Section";
import { notFound } from "next/navigation";
import SocialMediaProfiles from "@/components/SocialMediaProfiles";

export const revalidate = 3600;


// Pre-generate static paths for known people
export async function generateStaticParams() {
  const people = await listPersons(50);
  return people.map((p) => ({ slug: p.slug }));
}

// Dynamic metadata per person
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const person = await listPersonsBySlugs([slug]).then((arr) => arr[0]);

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const canonicalPath = `/person/${slug}`;
  const title = person ? `${person.title} | SonShine Roofing` : 'Team Member | SonShine Roofing';
  const description = person ? stripHtml(person.contentHtml).slice(0, 160) : 'Meet the SonShine Roofing team serving Sarasota, Manatee, and Charlotte Counties.';
  const ogImage = person?.featuredImage?.url || '/og-default.jpg';

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: false, follow: true },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: canonicalPath,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = await listPersonsBySlugs([slug]).then(arr => arr[0]);
  if (!person) return notFound();

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const pageUrl = `${base}/person/${person.slug}`;
  const personId = `${pageUrl}#person`;
  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: person.title,
    jobTitle: person.positionTitle || undefined,
    image: person.featuredImage?.url ? { '@type': 'ImageObject', url: person.featuredImage.url } : undefined,
    url: pageUrl,
    worksFor: { '@id': `${base}/#roofingcontractor` },
  } as const;

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'About SonShine Roofing', item: `${base}/about-sonshine-roofing` },
      { '@type': 'ListItem', position: 3, name: person.title, item: pageUrl },
    ],
  } as const;

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${person.title} | SonShine Roofing`,
    description: stripHtml(person.contentHtml).slice(0, 160),
    url: pageUrl,
    primaryImageOfPage: person.featuredImage?.url ? { '@type': 'ImageObject', url: person.featuredImage.url } : { '@type': 'ImageObject', url: `${base}/og-default.jpg` },
    isPartOf: { '@type': 'WebSite', name: 'SonShine Roofing', url: base },
  } as const;

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="gap-4 overflow-visible items-start">

          <article className="mx-auto max-w-5xl">
            <div className="my-4">
              <a href="/about-sonshine-roofing/#meet-our-team" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← Back to Team</a>
            </div>
            <header className="flex flex-col gap-6 p-5">
              {person.featuredImage && (
                <div className="relative w-full md:w-1/2 lg:w-1/2 aspect-[5/3] overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={person.featuredImage.url}
                    alt={person.featuredImage.altText || person.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>

              )}
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-slate-900">{person.title}</h1>
                {/* JSON-LD: Person + BreadcrumbList + WebPage */}
                <script
                  type="application/ld+json"
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
                />
                <script
                  type="application/ld+json"
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
                />
                <script
                  type="application/ld+json"
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
                />
                {person.positionTitle && (
                  <p className="mt-1 text-base font-medium text-[#0045d7]">{person.positionTitle}</p>
                )}
              </div>
            </header>

            <div className="mt-8 prose max-w-none border border-slate-300 bg-white p-5 rounded-2xl" dangerouslySetInnerHTML={{ __html: person.contentHtml }} />
          </article>
        </div>
      </div>
    </Section>
  );
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
