import { listPersonNav, listPersonsBySlug, stripHtml } from "@/lib/wp";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SmartLink from "@/components/SmartLink";
import Section from "@/components/layout/Section";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// Dynamic metadata per person
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let person = null;
  try {
    person = await listPersonsBySlug(slug, { cache: "no-store" });
  } catch {
    person = null;
  }
  const isNathan = slug === 'nathan-borntreger';

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const canonicalPath = `/person/${slug}`;
  const title = person ? `${person.title} | SonShine Roofing` : 'Team Member | SonShine Roofing';
  const description = person?.contentHtml
    ? stripHtml(person.contentHtml).slice(0, 160)
    : 'Meet the SonShine Roofing team serving Sarasota, Manatee, and Charlotte Counties.';
  const ogImage = person?.featuredImage?.url || '/og-default.png';

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: isNathan, follow: true },
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
  const person = await listPersonsBySlug(slug, { cache: "no-store" }).catch(() => null);
  if (!person) return notFound();

  let navItems: Awaited<ReturnType<typeof listPersonNav>> = [];
  try {
    navItems = await listPersonNav(50);
  } catch {
    navItems = [];
  }
  const idx = navItems.findIndex((item) => item.slug === slug);
  const prev = idx >= 0 && idx < navItems.length - 1 ? navItems[idx + 1] : null;
  const next = idx > 0 ? navItems[idx - 1] : null;

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
    primaryImageOfPage: person.featuredImage?.url ? { '@type': 'ImageObject', url: person.featuredImage.url } : { '@type': 'ImageObject', url: `${base}/og-default.png` },
    isPartOf: { '@type': 'WebSite', name: 'SonShine Roofing', url: base },
  } as const;

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="gap-4 overflow-visible items-start">

          <article className="mx-auto max-w-5xl">
            <div className="my-4">
              <SmartLink href="/about-sonshine-roofing/#meet-our-team" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← Back to Team</SmartLink>
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

            {(prev || next) && (
              <nav className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
                {prev ? (
                  <Link href={`/person/${prev.slug}`} className="block rounded-xl p-3 hover:bg-slate-50">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Previous</div>
                    <div className="mt-1 font-medium text-slate-900">{prev.title}</div>
                    {prev.positionTitle && (
                      <div className="text-sm text-slate-600">{prev.positionTitle}</div>
                    )}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link href={`/person/${next.slug}`} className="block rounded-xl p-3 text-right hover:bg-slate-50">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Next</div>
                    <div className="mt-1 font-medium text-slate-900">{next.title}</div>
                    {next.positionTitle && (
                      <div className="text-sm text-slate-600">{next.positionTitle}</div>
                    )}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </article>
        </div>
      </div>
    </Section>
  );
}
