import Image from 'next/image';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import SpecialOfferForm from './SpecialOfferForm';
import { getSpecialOfferBySlug, listSpecialOfferSlugs, stripHtml } from '@/lib/wp';
import isExpired from '@/lib/isExpired';
import { formatSpecialOfferExpiration } from '@/lib/specialOfferDates';

type OgImageRecord = {
    url?: unknown;
    secureUrl?: unknown;
    width?: unknown;
    height?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const revalidate = 900;

export async function generateStaticParams() {
    const slugs = await listSpecialOfferSlugs(200).catch(() => []);
    return slugs.map((slug) => ({ slug }));
}

function buildRobotsMeta() {
    return {
        index: false,
        follow: true,
    } as const;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const offer = await getSpecialOfferBySlug(slug).catch(() => null);

    if (!offer) {
        return {
            title: 'Special Offer · SonShine Roofing',
            description: 'This special offer is not available right now.',
            robots: buildRobotsMeta(),
            alternates: { canonical: `/special-offers/${slug}` },
        };
    }

    const seo = offer.seo ?? {};
    const og = seo.openGraph ?? {};

    const title = (seo.title || og.title || offer.title || 'Special Offer · SonShine Roofing').trim();
    const descriptionSource = seo.description || og.description || stripHtml(offer.contentHtml || '') || '';
    const description = descriptionSource.slice(0, 160);

    const ogImageRecord = isRecord(og.image) ? (og.image as OgImageRecord) : null;
    const ogUrl =
        (ogImageRecord && typeof ogImageRecord.secureUrl === 'string' && ogImageRecord.secureUrl) ||
        (ogImageRecord && typeof ogImageRecord.url === 'string' && ogImageRecord.url) ||
        offer.featuredImage?.url ||
        '/og-default.png';
    const ogWidth =
        (ogImageRecord && typeof ogImageRecord.width === 'number' && ogImageRecord.width) || 1200;
    const ogHeight =
        (ogImageRecord && typeof ogImageRecord.height === 'number' && ogImageRecord.height) || 630;

    return {
        title,
        description,
        robots: buildRobotsMeta(),
        alternates: { canonical: `/special-offers/${slug}` },
        openGraph: {
            title,
            description,
            images: [{ url: ogUrl, width: ogWidth, height: ogHeight }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogUrl],
        },
    };
}

export default async function SpecialOfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offer = await getSpecialOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  const expired = isExpired(offer.expirationDate);
  const expirationLabel = formatSpecialOfferExpiration(offer.expirationDate);

  const cookieStore = await cookies();
  const cookieKey = `ss_offer_${offer.slug}`;
  const cookieValue = cookieStore.get(cookieKey)?.value ?? null;

  let initialUnlock: { offerCode: string } | null = null;
  if (!expired && offer.offerCode && cookieValue) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookieValue));
      const code = typeof parsed?.code === 'string' ? parsed.code : null;
      const expValue = parsed?.exp ? new Date(parsed.exp) : null;
      const stillValid = expValue ? expValue.getTime() >= Date.now() : true;
      if (code === offer.offerCode && stillValid) {
        initialUnlock = { offerCode: code };
      }
    } catch {
      // ignore malformed cookie
    }
  }

    return (
        <div>
            <section>
                <Container>
                    <div className="max-w-3xl space-y-6 rounded-2xl mt-24">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{offer.title}</h1>
                        {offer.discount && (
                            <p className="text-2xl font-semibold text-[--brand-blue] sm:text-3xl">{offer.discount}</p>
                        )}
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-100 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-slate-800">
                            Limited-Time Offer
                        </span>
                        {expirationLabel && (
                            <p className="text-sm font-medium text-slate-600">
                                {expired ? 'Offer expired on ' : 'Offer valid through '}
                                {expirationLabel}
                            </p>
                        )}
                    </div>
                </Container>
            </section>

            <Section className="pb-20">
                <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-start">
                    <article className="prose prose-slate max-w-none print:prose">
                        <div dangerouslySetInnerHTML={{ __html: offer.contentHtml }} />
                        {offer.featuredImage?.url && (
                            <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                                <Image
                                    src={offer.featuredImage.url}
                                    alt={offer.featuredImage.altText || offer.title}
                                    width={1280}
                                    height={720}
                                    className="h-auto w-full object-cover shadow-md"
                                    sizes="(max-width: 1024px) 100vw, 720px"
                                    loading="lazy"
                                />
                            </figure>
                        )}
                        {expired && (
                            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                                <h2 className="text-xl font-semibold">This offer has expired.</h2>
                                <p>Please check back soon for future promotions from SonShine Roofing.</p>
                            </div>
                        )}
                    </article>

                    <div className="sticky top-24 space-y-6">
            {!expired && offer.offerCode ? (
              <Suspense
                fallback={
                  <div className="rounded-3xl border border-blue-100 bg-white p-6 text-sm text-slate-600">
                    Loading offer form…
                  </div>
                }
              >
                <SpecialOfferForm
                  offerCode={offer.offerCode}
                  offerSlug={offer.slug}
                  offerTitle={offer.title}
                  offerExpiration={offer.expirationDate ?? null}
                  initialUnlock={initialUnlock}
                />
              </Suspense>
            ) : (
                            <div className="rounded-3xl border border-red-200 bg-white p-6 mb-24 shadow-sm">
                                <h2 className="text-xl font-semibold text-red-700">Offer unavailable</h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    This special offer has expired. Reach out to our team for current promotions.
                                </p>
                                <a href="tel:+19418664320" className="btn btn-brand-blue btn-md mt-4 inline-flex justify-center">
                                    Call (941) 866-4320
                                </a>
                            </div>
                        )}

                        {(offer.legalDisclaimers || offer.legalDisclaimers === '') && (
                            <div className="italic text-xs mx-2 text-slate-600 leading-[1.3rem] print:text-black">
                                <strong className="font-semibold text-slate-800 print:text-black">Disclaimer:</strong>{' '}
                                {offer.legalDisclaimers || ''}
                            </div>
                        )}
                    </div>
                </div>
            </Section>
        </div>
    );
}
