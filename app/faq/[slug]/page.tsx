import Section from '@/components/layout/Section';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getFaq, listFaqIndex, listFaqSlugs } from '@/lib/wp';
import type { FaqSummary } from '@/lib/wp';
import { buildBasicMetadata } from '@/lib/seo/meta';
import { JsonLd } from '@/lib/seo/json-ld';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/seo/site';
import SmartLink from '@/components/SmartLink';

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
  if (!faq) notFound();
  const title = faq?.title ? `${faq.title} – FAQ` : 'FAQ';
  const desc = faq?.contentHtml ? stripTags(faq.contentHtml).slice(0, 155) : 'Common roofing questions answered by SonShine Roofing.';
  const metadata = buildBasicMetadata({
    title,
    description: desc,
    path: `/faq/${slug}`,
  });
  metadata.robots = { index: false, follow: true };
  return metadata;
}

export default async function FAQSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const faq = await getFaq(slug).catch(() => null);

  if (!faq) notFound();

  // Build prev/next from index (alphabetical by title)
  const index = await listFaqIndex(1000).catch(() => [] as FaqSummary[]);
  const ordered = [...index].sort((a, b) => a.title.localeCompare(b.title));
  const i = ordered.findIndex((x) => x.slug === slug);
  const prev = i > 0 ? ordered[i - 1] : null;
  const next = i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null;

  const origin = SITE_ORIGIN;
  const pagePath = `/faq/${faq.slug}`;
  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: 'Home', item: '/' },
      { name: 'FAQ', item: '/faq' },
      { name: faq.title, item: pagePath },
    ],
    { origin },
  );
  const faqSchemaData = faqSchema(
    [
      {
        question: faq.title,
        answerHtml: faq.contentHtml,
        url: pagePath,
      },
    ],
    { origin, url: pagePath },
  );

  return (
    <Section>
      <article className="container-edge py-8">
        <nav className="mb-6 text-sm">
          <SmartLink href={{ pathname: '/faq' }} className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← All FAQs</SmartLink>
        </nav>

        <header>
          <h1 className="text-2xl font-semibold">{faq.title}</h1>
          {Array.isArray(faq.topicSlugs) && faq.topicSlugs.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {faq.topicSlugs.map((t) => (
                <SmartLink
                  key={t}
                  href={{ pathname: '/faq', query: { topic: t } }}
                  className="inline-flex min-w-0 max-w-full items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  <span className="block max-w-full truncate">{t}</span>
                </SmartLink>
              ))}
            </div>
          ) : null}
        </header>

        <div className="prose prose-slate lg:prose-lg leading-relaxed mt-6 max-w-none">
          <div dangerouslySetInnerHTML={{ __html: faq.contentHtml }} />
        </div>

        {/* Prev / Next */}
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          {prev ? (
            <SmartLink href={("/faq/" + prev.slug) as Route} className="group inline-flex items-center gap-2 text-slate-700 hover:text-[#0045d7]">
              <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">←</span>
              <span className="line-clamp-1">{prev.title}</span>
            </SmartLink>
          ) : <span />}
          {next ? (
            <SmartLink href={("/faq/" + next.slug) as Route} className="group inline-flex items-center gap-2 text-slate-700 hover:text-[#0045d7]">
              <span className="line-clamp-1">{next.title}</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </SmartLink>
          ) : <span />}
        </div>

        {/* Still Stuck CTA */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <SmartLink
            href="tel:19418664320"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="text-sm font-semibold text-slate-900">Still stuck?</div>
            <div className="mt-1 text-slate-700">Talk to a real roofer now.</div>
            <div className="mt-3 inline-flex rounded-md bg-[#0045d7] px-4 py-2 text-sm font-semibold text-white">Call (941) 866-4320</div>
          </SmartLink>
          <SmartLink
            href={{ pathname: '/contact-us', hash: 'book-an-appointment' }}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="text-sm font-semibold text-slate-900">Prefer to write?</div>
            <div className="mt-1 text-slate-700">Send us a message and we’ll follow up.</div>
            <div className="mt-3 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Contact form</div>
          </SmartLink>
        </div>

        <JsonLd data={breadcrumbsLd} />
        <JsonLd data={faqSchemaData} />
      </article>
    </Section>
  );
}
