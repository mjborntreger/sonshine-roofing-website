import { listPersonsBySlug, listPersons } from "@/lib/wp";
import Image from "next/image";
import Section from "@/components/layout/Section";
import { notFound } from "next/navigation";
import SocialMediaProfiles from "@/components/SocialMediaProfiles";

export const revalidate = 3600;

type Params = { params: { slug: string } };

// Pre-generate static paths for known people
export async function generateStaticParams() {
  const people = await listPersons(50);
  return people.map((p) => ({ slug: p.slug }));
}

// Dynamic metadata per person
export async function generateMetadata({ params }: Params) {
  const person = await listPersonsBySlug(params.slug);
  if (!person) return { title: "Team Member | SonShine Roofing" };

  const desc = stripHtml(person.contentHtml).slice(0, 160);
  return {
    title: `${person.title} | SonShine Roofing`,
    description: desc,
    openGraph: {
      title: `${person.title} | SonShine Roofing`,
      description: desc,
      images: person.featuredImage ? [{ url: person.featuredImage.url, alt: person.featuredImage.altText || person.title }] : [],
    },
  };
}

export default async function PersonPage({ params }: Params) {
  const person = await listPersonsBySlug(params.slug);
  if (!person) return notFound();

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">

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
                {person.positionTitle && (
                  <p className="mt-1 text-base font-medium text-[#0045d7]">{person.positionTitle}</p>
                )}
              </div>
            </header>

            <div className="mt-8 prose max-w-none border border-slate-300 bg-white p-5 rounded-2xl" dangerouslySetInnerHTML={{ __html: person.contentHtml }} />
          </article>

          <div className="lg:sticky lg:top-24 self-start min-w-0">
            <SocialMediaProfiles />
          </div>

        </div>
      </div>
    </Section>
  );
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}