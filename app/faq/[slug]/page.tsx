import Section from '@/components/layout/Section';
import Link from 'next/link';
import type { Route } from 'next';
import { getFaq, listFaqIndex, listFaqSlugs } from '@/lib/wp';
import type { FaqSummary } from '@/lib/wp';
import { suggest } from '@/lib/fuzzy';

export const revalidate = 3600; // 1h

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export async function generateStaticParams() {
  const slugs = await listFaqSlugs(500).catch(() => [] as string[]);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const faq = await getFaq(slug).catch(() => null);
  const title = faq?.title ? `${faq.title} – FAQ` : 'FAQ';
  const desc = faq?.contentHtml ? stripTags(faq.contentHtml).slice(0, 155) : 'Common roofing questions answered by SonShine Roofing.';
  return {
    title,
    description: desc,
    alternates: { canonical: `/faq/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function FAQSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const faq = await getFaq(slug).catch(() => null);

  if (!faq) {
    // Build quick suggestions from the index
    const pool: FaqSummary[] = await listFaqIndex(600).catch(() => []);
    const suggestions = suggest(slug.replace(/[-_]+/g, ' '), pool.map((p) => ({ title: p.title, slug: p.slug })), 5);

    return (
      <Section>
        <div className="container-edge py-8">
          <h1 className="text-2xl font-semibold">We couldn’t find that FAQ</h1>
          <p className="mt-2 text-slate-600">Try one of these related questions or browse the full FAQ archive.</p>

          {suggestions.length > 0 ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {suggestions.map((s) => {
                const href = (`/faq/${s.slug}`) as Route;
                return (
                  <li key={s.slug}>
                    <Link href={href} className="block rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50">
                      {s.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/faq" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← All FAQs</Link>
            <Link href={{ pathname: '/contact-us', hash: 'book-an-appointment' }} className="rounded-md bg-[#0045d7] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Still stuck? Contact us</Link>
          </div>
        </div>
      </Section>
    );
  }

  // Build prev/next from index (alphabetical by title)
  const index = await listFaqIndex(1000).catch(() => [] as FaqSummary[]);
  const ordered = [...index].sort((a, b) => a.title.localeCompare(b.title));
  const i = ordered.findIndex((x) => x.slug === slug);
  const prev = i > 0 ? ordered[i - 1] : null;
  const next = i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null;

  return (
    <Section>
      <article className="container-edge py-8">
        <nav className="mb-6 text-sm">
          <Link href={{ pathname: '/faq' }} className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← All FAQs</Link>
        </nav>

        <header>
          <h1 className="text-2xl font-semibold">{faq.title}</h1>
          {Array.isArray(faq.topicSlugs) && faq.topicSlugs.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {faq.topicSlugs.map((t) => (
                <Link
                  key={t}
                  href={{ pathname: '/faq', query: { topic: t } }}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  {t}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <div className="prose prose-slate lg:prose-lg leading-relaxed mt-6 max-w-none">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: faq.contentHtml }} />
        </div>

        {/* Prev / Next */}
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          {prev ? (
            <Link href={("/faq/" + prev.slug) as Route} className="group inline-flex items-center gap-2 text-slate-700 hover:text-[#0045d7]">
              <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">←</span>
              <span className="line-clamp-1">{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={("/faq/" + next.slug) as Route} className="group inline-flex items-center gap-2 text-slate-700 hover:text-[#0045d7]">
              <span className="line-clamp-1">{next.title}</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          ) : <span />}
        </div>

        {/* Still Stuck CTA */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link
            href="tel:19418664320"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="text-sm font-semibold text-slate-900">Still stuck?</div>
            <div className="mt-1 text-slate-700">Talk to a real roofer now.</div>
            <div className="mt-3 inline-flex rounded-md bg-[#0045d7] px-4 py-2 text-sm font-semibold text-white">Call (941) 866-4320</div>
          </Link>
          <Link
            href={{ pathname: '/contact-us', hash: 'book-an-appointment' }}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="text-sm font-semibold text-slate-900">Prefer to write?</div>
            <div className="mt-1 text-slate-700">Send us a message and we’ll follow up.</div>
            <div className="mt-3 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Contact form</div>
          </Link>
        </div>

        {/* JSON-LD for a single FAQ */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: faq.title,
                  acceptedAnswer: { '@type': 'Answer', text: stripTags(faq.contentHtml) },
                },
              ],
            }),
          }}
        />
      </article>
    </Section>
  );
}
