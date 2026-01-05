import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HeroTrustBar from "@/components/marketing/landing-page/HeroTrustBar";
import SimpleLeadForm from "@/components/lead-capture/lead-form/SimpleLeadForm";
import SmartLink from "@/components/utils/SmartLink";
import { renderHighlight } from "@/components/utils/renderHighlight";
import {
  LANDING_PAGE_SLUGS,
  type LandingPageConfig,
  type LandingPageSlug,
  getLandingPageConfig,
} from "@/lib/landing-pages/config";
import { ensureAbsoluteUrl } from "@/lib/seo/site";

const PHONE_DISPLAY = "(941) 866-4320";
const PHONE_E164 = "+19418664320";

const MATERIALS = [
  {
    label: "Shingle",
    blurb: "Budget-friendly, wind-rated shingles installed by in-house crews.",
    imageSrc: "https://next.sonshineroofing.com/wp-content/uploads/Shingle-Roof.webp",
    imageAlt: "Architectural shingle roof",
  },
  {
    label: "Metal",
    blurb: "Sleek standing seam systems built to beat Florida sun and storms.",
    imageSrc: "https://next.sonshineroofing.com/wp-content/uploads/Metal-Roof.webp",
    imageAlt: "Metal roof on a modern home",
  },
  {
    label: "Tile",
    blurb: "Classic tile roofs with proper underlayment and code-driven installs.",
    imageSrc: "https://next.sonshineroofing.com/wp-content/uploads/Tile-Roof.webp",
    imageAlt: "Tile roof on a Florida home",
  },
];

type Params = { params: Promise<{ slug: string }> };

function resolveConfig(slug: string): LandingPageConfig | null {
  return getLandingPageConfig(slug);
}

export function generateStaticParams(): { slug: LandingPageSlug }[] {
  return LANDING_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const config = resolveConfig(slug);

  if (!config) {
    return {
      title: "Landing page not found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = ensureAbsoluteUrl(config.seo.canonicalPath);

  return {
    title: config.seo.title,
    description: config.seo.description,
    alternates: { canonical },
    robots: { index: false, follow: false },
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      url: canonical,
    },
  };
}

function HeroSection({ config }: { config: LandingPageConfig }) {
  const { hero, serviceArea, city } = config;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0f4c81] via-[#0f6fab] to-[#0f4c81] text-white">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[#fb9216]/10 blur-3xl" aria-hidden="true" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:grid lg:grid-cols-[1.05fr_minmax(360px,1fr)] lg:items-start lg:gap-10 lg:py-14">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">{serviceArea}</p>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              {renderHighlight(hero.headline, city)}
            </h1>
            <p className="text-lg text-blue-50/80 md:text-xl">{hero.subhead}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm md:text-base">
            <span className="rounded-full bg-white/10 px-3 py-2 font-semibold text-white shadow-sm ring-1 ring-white/20">
              {hero.offer}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-2 font-semibold text-white shadow-sm ring-1 ring-white/20">
              Licensed & Insured | Lic. #CCC1331483
            </span>
            <span className="rounded-full bg-white/10 px-3 py-2 font-semibold text-white shadow-sm ring-1 ring-white/20">
              Financing options, 0% APR for 12 months
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <SmartLink
                href="#estimate-form"
                className="btn btn-lg btn-brand-orange rounded-xl px-5 py-3 text-lg font-semibold shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
              >
                {hero.primaryCta}
              </SmartLink>
              <SmartLink
                href={`tel:${PHONE_E164}`}
                className="btn btn-lg rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/60"
              >
                Call {PHONE_DISPLAY}
              </SmartLink>
            </div>
            <p className="text-sm text-blue-100/80">
              Form-first CTA for faster scheduling. Prefer to talk? Tap to call and mention you saw this ad.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureChip title="Installations, Repairs, Inspections" />
            <FeatureChip title="In-house crews only—no subs" />
            <FeatureChip title="Since 1987—38+ years local" />
            <FeatureChip title="Warranty-backed workmanship" />
          </div>
        </div>

        <div className="relative">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 text-sm text-blue-50 shadow-lg backdrop-blur">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/30 bg-white/10">
              <Image
                src={hero.heroImage}
                alt={`Roofing project in ${city}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-blue-100/90">Free Roofing Estimate</p>
              <p className="text-base font-semibold text-white">Skip the wait—request your quote now.</p>
            </div>
          </div>
          <div
            id="estimate-form"
            className="rounded-3xl border border-white/20 bg-white text-slate-900 shadow-2xl shadow-black/10"
          >
            <SimpleLeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureChip({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
      <span className="inline-block h-2 w-2 rounded-full bg-[--brand-orange]" aria-hidden="true" />
      {title}
    </div>
  );
}

function MaterialsSection() {
  return (
    <section className="bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Roofing Materials</p>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Shingle, Metal, and Tile—equally prioritized</h2>
          </div>
          <p className="text-sm text-slate-600">
            We recommend the right system for your home, budget, and wind zone. No upsells—just the best fit.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {MATERIALS.map((material) => (
            <div
              key={material.label}
              className="group rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-44 overflow-hidden rounded-t-2xl bg-slate-100">
                <Image
                  src={material.imageSrc}
                  alt={material.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 320px, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2 p-4">
                <h3 className="text-lg font-semibold text-slate-900">{material.label}</h3>
                <p className="text-sm text-slate-600">{material.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ gallery, city }: { gallery: string[]; city: string }) {
  if (!gallery.length) return null;

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent Projects</p>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Roofs completed near {city}</h2>
          </div>
          <p className="text-sm text-slate-600">Real homes we&apos;ve roofed—built to Florida codes and climates.</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="overflow-hidden rounded-2xl border border-blue-100 bg-slate-50 shadow-sm"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={src}
                  alt={`Roofing project ${index + 1} near ${city}`}
                  fill
                  sizes="(min-width: 1024px) 320px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta({ city }: { city: string }) {
  return (
    <section className="bg-gradient-to-r from-[#fb9216] via-[#ffb35a] to-[#fb9216] py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-800/80">Ready to start?</p>
          <h2 className="text-2xl font-bold md:text-3xl">Lock in your free roofing estimate in {city}</h2>
          <p className="text-sm text-slate-800">
            Form submissions go straight to our in-house team. We respond quickly during business hours.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <SmartLink
            href="#estimate-form"
            className="btn btn-lg rounded-xl bg-slate-900 px-5 py-3 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Start my free estimate
          </SmartLink>
          <SmartLink
            href={`tel:${PHONE_E164}`}
            className="btn btn-lg rounded-xl border border-slate-900/20 bg-white/80 px-5 py-3 text-lg font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-900/40"
          >
            Prefer to call? {PHONE_DISPLAY}
          </SmartLink>
        </div>
      </div>
    </section>
  );
}

export default async function LandingPage({ params }: Params) {
  const { slug } = await params;
  const config = resolveConfig(slug);

  if (!config) {
    notFound();
  }

  return (
    <main className="bg-slate-50">
      <HeroSection config={config} />
      <HeroTrustBar heading={`Top-rated roofer near ${config.city}`} highlightText={config.city} />
      <MaterialsSection />
      <GallerySection gallery={config.gallery} city={config.city} />
      <ClosingCta city={config.city} />
    </main>
  );
}
