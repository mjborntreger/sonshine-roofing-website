import { listPersonNav, listPersonsBySlug, stripHtml } from "@/lib/content/wp";
import type { Metadata } from "next";
import Image from "next/image";
import SmartLink from "@/components/utils/SmartLink";
import Section from "@/components/layout/Section";
import { notFound } from "next/navigation";
import { buildProfileMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, personSchema, webPageSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const revalidate = 86400;
const PERSON_REVALIDATE_SECONDS = revalidate;

// Dynamic metadata per person
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let person = null;
  try {
    person = await listPersonsBySlug(slug, { revalidateSeconds: PERSON_REVALIDATE_SECONDS });
  } catch {
    person = null;
  }
  const isNathan = slug === 'nathan-borntreger';

  const canonicalPath = `/person/${slug}`;
  const title = person ? `${person.title} | SonShine Roofing` : 'Team Member | SonShine Roofing';
  const description = person?.contentHtml
    ? stripHtml(person.contentHtml).slice(0, 160)
    : 'Meet the SonShine Roofing team serving Sarasota, Manatee, and Charlotte Counties.';
  const ogImage = person?.featuredImage?.url || '/og-default.png';

  const [firstName, ...restName] = person?.title?.split(" ") ?? [];
  const metadata = buildProfileMetadata({
    title,
    description,
    path: canonicalPath,
    image: { url: ogImage, width: 1200, height: 630 },
    profile: firstName
      ? {
          firstName,
          lastName: restName.length ? restName.join(" ") : undefined,
        }
      : undefined,
  });

  metadata.robots = { index: isNathan, follow: true };
  return metadata;
}

export async function generateStaticParams() {
  const navItems = await listPersonNav(50).catch(() => [] as Awaited<ReturnType<typeof listPersonNav>>);
  return navItems.map(({ slug }) => ({ slug }));
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [person, navItems] = await Promise.all([
    listPersonsBySlug(slug, { revalidateSeconds: PERSON_REVALIDATE_SECONDS }).catch(() => null),
    listPersonNav(50).catch(() => [] as Awaited<ReturnType<typeof listPersonNav>>),
  ]);
  if (!person) return notFound();

  const idx = navItems.findIndex((item) => item.slug === slug);
  const prev = idx >= 0 && idx < navItems.length - 1 ? navItems[idx + 1] : null;
  const next = idx > 0 ? navItems[idx - 1] : null;

  const origin = SITE_ORIGIN;
  const pagePath = `/person/${person.slug}`;

  const personLd = personSchema({
    name: person.title,
    description: stripHtml(person.contentHtml).slice(0, 160),
    url: pagePath,
    origin,
    jobTitle: person.positionTitle ?? undefined,
    image: person.featuredImage?.url,
    worksFor: `${origin}/#roofingcontractor`,
  });

  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: 'Home', item: '/' },
      { name: 'About SonShine Roofing', item: '/about-sonshine-roofing' },
      { name: person.title, item: pagePath },
    ],
    { origin },
  );

  const webPageLd = webPageSchema({
    name: `${person.title} | SonShine Roofing`,
    description: stripHtml(person.contentHtml).slice(0, 160),
    url: pagePath,
    origin,
    primaryImage: person.featuredImage?.url ?? '/og-default.png',
    isPartOf: { '@type': 'WebSite', name: 'SonShine Roofing', url: origin },
  });

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
                <JsonLd data={personLd} />
                <JsonLd data={breadcrumbsLd} />
                <JsonLd data={webPageLd} />
                {person.positionTitle && (
                  <p className="mt-1 text-base font-medium text-[#0045d7]">{person.positionTitle}</p>
                )}
              </div>
            </header>

            <div className="mt-8 prose max-w-none border border-blue-300 bg-white p-5 rounded-2xl" dangerouslySetInnerHTML={{ __html: person.contentHtml }} />

            {(prev || next) && (
              <nav className="mt-8 grid gap-4 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:grid-cols-2">
                {prev ? (
                  <SmartLink href={`/person/${prev.slug}`} className="block rounded-xl p-3 hover:bg-slate-50">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Previous</div>
                    <div className="mt-1 font-medium text-slate-900">{prev.title}</div>
                    {prev.positionTitle && (
                      <div className="text-sm text-slate-600">{prev.positionTitle}</div>
                    )}
                  </SmartLink>
                ) : (
                  <span />
                )}
                {next ? (
                  <SmartLink href={`/person/${next.slug}`} className="block rounded-xl p-3 text-right hover:bg-slate-50">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Next</div>
                    <div className="mt-1 font-medium text-slate-900">{next.title}</div>
                    {next.positionTitle && (
                      <div className="text-sm text-slate-600">{next.positionTitle}</div>
                    )}
                  </SmartLink>
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
