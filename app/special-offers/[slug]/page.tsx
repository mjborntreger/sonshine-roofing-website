import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import SpecialOfferForm from './SpecialOfferForm';
import { getSpecialOfferBySlug, listSpecialOfferSlugs, stripHtml } from '@/lib/wp';
import isExpired from '@/lib/isExpired';

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

    const rmImg = (og.image || {}) as any;
    const ogUrl: string = rmImg.secureUrl || rmImg.url || offer.featuredImage?.url || '/og-default.png';
    const ogWidth: number = rmImg.width || 1200;
    const ogHeight: number = rmImg.height || 630;

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

function formatExpirationDate(raw?: string | null) {
    if (!raw) return null;
    // Field is stored as m/d/Y (e.g., 10/01/2025)
    const [month, day, year] = raw.split('/').map((part) => Number.parseInt(part, 10));
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

export default async function SpecialOfferPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const offer = await getSpecialOfferBySlug(slug);

    if (!offer) {
        notFound();
    }

    const expired = isExpired(offer.expirationDate);
    const expirationLabel = formatExpirationDate(offer.expirationDate);

    return (
        <div className="bg-neutral-50">
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

                    <div className="space-y-6 sticky top-32">
                        {!expired && offer.offerCode ? (
                            <SpecialOfferForm offerCode={offer.offerCode} offerSlug={offer.slug} offerTitle={offer.title} />

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
