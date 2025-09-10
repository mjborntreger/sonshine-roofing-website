import Section from "@/components/layout/Section";
import TocFromHeadings from "@/components/TocFromHeadings";
import UiLink from "@/components/UiLink";
import Image from "next/image";
import ServicesQuickLinks from "@/components/ServicesQuickLinks";
import { listRecentPostsPool } from "@/lib/wp";
import YouMayAlsoLike from "@/components/YouMayAlsoLike";
import { ShieldCheck, Layers, BadgeCheck, Wrench, ListChecks, ChevronDown } from "lucide-react";
import RepairVsReplace from "@/components/RepairVsReplace";
import type { Metadata } from 'next';

const scrollGuard = "scroll-mt-24";
const detailsStyles = "group not-prose rounded-xl border border-slate-400 bg-white mb-4";
const summaryStyles = "flex items-center justify-between cursor-pointer select-none p-4";
const figureStyles = "not-prose py-8";
const liStyles = "relative pl-4";
const stepperStyles = "absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-[#0045d7]";

// ===== STATIC SEO FOR /roof-replacement-sarasota-fl (EDIT HERE) =====
const SEO_TITLE_ROOF_REPLACEMENT = 'Roof Replacement in Sarasota, Manatee & Charlotte Counties | SonShine Roofing';
const SEO_DESCRIPTION_ROOF_REPLACEMENT = 'Need a roof replacement in Southwest Florida? Since 1987, SonShine Roofing has installed long‑lasting shingle, tile, and metal roofs with strong workmanship warranties.';
const SEO_KEYWORDS_ROOF_REPLACEMENT = [
  'roof replacement',
  'new roof',
  're-roof',
  'shingle roof replacement',
  'tile roof replacement',
  'metal roof replacement',
  'Sarasota roofing',
  'Manatee County roofing',
  'Charlotte County roofing'
];
const SEO_CANONICAL_ROOF_REPLACEMENT = '/roof-replacement-sarasota-fl';
const SEO_OG_IMAGE_DEFAULT = '/og-default.jpg';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_ROOF_REPLACEMENT,
    description: SEO_DESCRIPTION_ROOF_REPLACEMENT,
    keywords: SEO_KEYWORDS_ROOF_REPLACEMENT,
    alternates: { canonical: SEO_CANONICAL_ROOF_REPLACEMENT },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_ROOF_REPLACEMENT,
      description: SEO_DESCRIPTION_ROOF_REPLACEMENT,
      url: SEO_CANONICAL_ROOF_REPLACEMENT,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_ROOF_REPLACEMENT,
      description: SEO_DESCRIPTION_ROOF_REPLACEMENT,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}


export default async function Page() {
  const pool = await listRecentPostsPool(36);
  // JSON-LD (WebPage, BreadcrumbList, HowTo) — keep simple & page-scoped
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const pagePath = SEO_CANONICAL_ROOF_REPLACEMENT;
  const pageUrl = `${base}${pagePath}`;

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SEO_TITLE_ROOF_REPLACEMENT,
    description: SEO_DESCRIPTION_ROOF_REPLACEMENT,
    url: pageUrl,
    primaryImageOfPage: { '@type': 'ImageObject', url: `${base}${SEO_OG_IMAGE_DEFAULT}` },
    isPartOf: { '@type': 'WebSite', name: 'SonShine Roofing', url: base },
  } as const;

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Roof Replacement', item: pageUrl },
    ],
  } as const;

  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Roof Replacement: What to Expect',
    description: 'Step-by-step overview of a typical roof replacement from permits through final inspection and warranty.',
    totalTime: undefined,
    step: [
      { '@type': 'HowToStep', name: 'Permits & Scheduling', text: 'We file permits and set your installation date.' },
      { '@type': 'HowToStep', name: 'Site Prep', text: 'We protect landscaping and the home exterior.' },
      { '@type': 'HowToStep', name: 'Tear-off & Inspection', text: 'We remove old materials and inspect decking.' },
      { '@type': 'HowToStep', name: 'Install New Roof', text: 'Underlayment, flashing, ventilation, and finishing materials are installed.' },
      { '@type': 'HowToStep', name: 'Final Inspection & Cleanup', text: 'We inspect the final install and clean the site.' },
      { '@type': 'HowToStep', name: 'Warranty & Maintenance', text: 'We provide warranty info and maintenance tips.' }
    ],
    url: pageUrl,
  } as const;
  return (
    <>
      <Section>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div id="article-root" className="prose min-w-0">
            <span id="page-top" className="sr-only" />
            <h1>Roof Replacement</h1>
            {/* JSON-LD: WebPage + BreadcrumbList + HowTo */}
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
            />
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
            />
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
            />

            <h2 className={scrollGuard}>How do you know if you need a roof replacement?</h2>
            <p>
              The thought of replacing your roof may feel overwhelming,
              but we’re here to help. Our Roofing Specialists and Production
              Team will walk you through the process, answer your questions,
              and be available to you even after your new roof is completed.
              <br /><br />
              Workmanship warranties are available on all of our roof replacements.
              SonShine offers coverage ranging from 6 to 25 years, depending on
              the materials you choose when building your new roof.
            </p>

            {/* Financing band */}
            <div className="my-6 rounded-xl bg-[#00e3fe]/10 border border-[#00e3fe]/30 p-4 not-prose">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="m-0 text-slate-800"><strong>Prefer monthly payments?</strong> Explore our flexible financing options.</p>
                <UiLink href="/financing" className="btn btn-brand-blue btn-press h-11 px-5" aria-label="Explore financing options">Explore financing</UiLink>
              </div>
            </div>

            <h2 className={scrollGuard}>What Should You Know Before Getting a Roof Replacement?</h2>
            <details className={detailsStyles}>
              <summary className={summaryStyles}>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                  <h3 className={scrollGuard + " m-0"}>Know Your Contractor</h3>
                </span>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="prose px-4 pb-4 pt-0">
                <p>
                  SonShine Roofing is licensed by the State of Florida as a roofing
                  contractor and is fully insured. While state law requires roofers
                  to carry a valid license and insurance, neither guarantees quality
                  workmanship, real experience, or a long-lasting roof.
                </p>

                <figure className={figureStyles}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image
                      src="https://next.sonshineroofing.com/wp-content/uploads/Nathan-Borntreger-Owner-President-Sonshine-Roofing.webp"
                      alt="Nathan Borntreger, owner of SonShine Roofing"
                      fill
                      className="object-cover mb-2"
                      sizes="(max-width: 768px) 100vw, 800px"
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="mt-2 text-sm text-slate-600">
                    <strong>Nathan Borntreger</strong> — Owner of SonShine Roofing • Insured • LIC: #CCC1331483 | <a className="text-[--brand-blue]" href="/person/nathan-borntreger">See full bio</a>
                  </figcaption>
                </figure>

                <p>
                  We bring over 50 years of combined expertise and hands-on experience
                  to your real-world roofing needs. Our roofing crews are true employees
                  of SonShine Roofing—not subcontractors—and we invest in their ongoing
                  roofing education to keep pace with evolving industry standards.
                </p>
              </div>
            </details>

            <details className={detailsStyles}>
              <summary className={summaryStyles}>
                <span className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                  <h3 className={scrollGuard + " m-0"}>Know What Materials You Need</h3>
                </span>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="prose px-4 pb-4 pt-0">
                <p>
                  There are many roofing material options available to choose from,
                  and we’re here to help you determine what’s best for your home. As
                  with any roof replacement or home improvement project, material selection
                  plays a key role in the lifespan and performance of your roof.
                  <br /><br />
                  Elements like the type of nails used, quality of the underlayment, and
                  balanced, efficient attic ventilation all contribute to a successful
                  roof system. At SonShine Roofing, we take the time to walk you through
                  every material option and answer your questions thoroughly.
                </p>

                <figure className={figureStyles}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image
                      src="https://next.sonshineroofing.com/wp-content/uploads/difference-between-tile-vs-metal-vs-shingle-roofs.jpg"
                      alt="Roof replacement choices"
                      fill
                      className="object-cover mb-2"
                      sizes="(max-width: 768px) 100vw, 800px"
                      loading="lazy"
                    />
                  </div>
                </figure>

                <p>
                  It’s not just about the materials themselves — proper installation is equally
                  important. Our experienced team ensures that every component is installed to
                  the highest standard for long-term durability and protection.
                </p>
              </div>
            </details>

            <details className={detailsStyles}>
              <summary className={summaryStyles}>
                <span className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                  <h3 className={scrollGuard + " m-0"}>Know What Warranties Come with Your New Roof</h3>
                </span>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="prose px-4 pb-4 pt-0">
                <p>
                  There are usually two types of warranty that come with your new roof: workmanship and manufacturer.
                  <br /><br />
                </p>

                <h4 className={scrollGuard}>Workmanship Warranty</h4>
                {/* Inline callout (#6) */}
                <div className="my-4 rounded-xl border border-[#fb9216]/30 bg-[#fb9216]/5 p-4" role="note" aria-label="Important">
                  <strong className="block text-slate-900 mb-1">Fact:</strong>
                  <p className="m-0 text-slate-700">
                    The vast majority of roof failures are caused by poor workmanship, and
                    often you won’t notice these errors for many years down the line without yearly
                    inspections.
                  </p>
                </div>
                <p>
                  This is why it is important to seek out roofers who stand behind their work
                  with extended workmanship warranties and have a long-standing reputation.
                  This ensures that you won’t be on the hook for costly repairs that are not
                  your fault.
                  <br /><br />
                  Depending on your roof and warranty package, you can enjoy up to 30 years of
                  workmanship coverage with SonShine Roofing.
                  <br /><br />
                </p>

                <h4 className={scrollGuard}>Manufacturer Warranty</h4>
                <p>
                  Many roofing materials also come with warranties directly from the manufacturer
                  that protect against product defects. That being said, such defects are incredibly
                  rare with reputable vendors such as GAF, Eagle Tile, Westlake Royal Roofing,
                  Polyglass USA, Crown Tile, and Sunshine State Metals.
                  <br /><br />
                  These warranties typically last for decades, some even up to 50 years on more
                  durable materials such as metal or tile.
                  <br /><br />
                </p>

                <h4 className={scrollGuard}>Important Note</h4>
                <p>
                  As with any contract, always read the fine print before you sign. Be aware that
                  warranties typically do not cover anything considered beyond “normal wear and tear.”
                  <br /><br />
                  For example, if a tree falls on your roof during a hurricane, that is neither the
                  manufacturer’s nor the roofer’s fault. Ideally this sort of event would be covered
                  by your insurance company.
                </p>
              </div>
            </details>

            <details className={detailsStyles}>
              <summary className={summaryStyles}>
                <span className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                  <h3 className={scrollGuard + " m-0"}>Know the Importance of Roof Maintenance</h3>
                </span>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="prose px-4 pb-4 pt-0">
                <p>
                  A roof replacement is a major investment—but that doesn’t mean your new roof is “set
                  it and forget it.” Regular maintenance is the key to protecting your roof’s longevity
                  and your home’s safety. Even the highest quality roofing materials need routine care
                  to withstand Florida’s heat, storms, and humidity. Without regular checkups, small
                  issues like clogged gutters or cracked flashing can quickly snowball into expensive
                  repairs or premature failure.
                </p>

                <figure className={figureStyles}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image
                      src="https://next.sonshineroofing.com/wp-content/uploads/roofer-roof-maintenance.jpg"
                      alt="The importance of roof maintenance"
                      fill
                      className="object-cover mb-2"
                      sizes="(max-width: 768px) 100vw, 800px"
                      loading="lazy"
                    />
                  </div>
                </figure>
                <p>
                  At SonShine Roofing, we’ve seen it all—shingles lifted by summer storms, debris buildup
                  that traps moisture, and flashing that’s been slowly leaking for months. The good news?
                  These are all preventable with the right maintenance plan. We recommend annual inspections
                  and seasonal touch-ups to keep your roof performing like it should.
                  <br /><br />
                  Proper maintenance not only extends the life of your roof but also preserves your warranty,
                  safeguards your home’s structure, and helps you avoid the stress of emergency repairs. Whether
                  your roof is brand new or pushing its limits, we’re here to help you stay ahead of the
                  curve—because since 1987, we’ve got you covered.
                </p>

                {/* Inline callout (#6) */}
                <div className="my-4 rounded-xl border border-[#fb9216]/30 bg-[#fb9216]/5 p-4" role="note" aria-label="Pro tip">
                  <strong className="block text-slate-900 mb-1">Pro tip</strong>
                  <p className="m-0 text-slate-700">Annual inspections keep warranties valid and catch small issues before they become leaks.</p>
                </div>
              </div>
            </details>

            <details className="group not-prose rounded-xl border border-slate-400 bg-white mb-6">
              <summary className={summaryStyles}>
                <span className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                  <h3 className={scrollGuard + " m-0"}>Know What to Expect</h3>
                </span>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="prose px-4 pb-4 pt-0">
                {/* Stepper timeline (#4) */}
                <ol className="my-4 not-prose border-l border-slate-400 pl-6 space-y-4">
                  <li className={liStyles}>
                    <span className={stepperStyles} />
                    <p className="m-0"><strong>Permits &amp; Scheduling</strong> — We file permits and set your installation date.</p>
                  </li>
                  <li className={liStyles}>
                    <span className={stepperStyles} />
                    <p className="m-0"><strong>Site Prep</strong> — Protect landscaping &amp; home exterior.</p>
                  </li>
                  <li className={liStyles}>
                    <span className={stepperStyles} />
                    <p className="m-0"><strong>Tear‑off &amp; Inspection</strong> — Remove old materials, inspect decking.</p>
                  </li>
                  <li className={liStyles}>
                    <span className={stepperStyles} />
                    <p className="m-0"><strong>Install New Roof</strong> — Underlayment, flashing, ventilation, and finish roof.</p>
                  </li>
                  <li className={liStyles}>
                    <span className={stepperStyles} />
                    <p className="m-0"><strong>Final Inspection &amp; Cleanup</strong> — Ensure quality and clean the site.</p>
                  </li>
                  <li className={liStyles}>
                    <span className={stepperStyles} />
                    <p className="m-0"><strong>Warranty &amp; Maintenance</strong> — Provide warranty info and maintenance tips.</p>
                  </li>
                </ol>
              </div>
            </details>

            <RepairVsReplace />

          </div>

          <aside className="sticky top-24 self-start h-fit lg:w-[320px]">
            <ServicesQuickLinks />

            <TocFromHeadings
              root="#article-root"
              offset={128}
              className="hidden lg:block" />

            <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm not-prose">
              <div className="mb-2 text-sm font-semibold text-slate-900 text-center">Ready to get started?</div>
              <UiLink
                href="/contact-us#book-an-appointment"
                className="btn btn-brand-blue btn-press w-full h-11"
                aria-label="Request a Free Roof Estimate">
                Book a Free Estimate
              </UiLink>
              <UiLink
                href="https://www.myquickroofquote.com/contractors/sonshine-roofing"
                className="btn btn-brand-orange btn-press w-full h-11 mt-2"
                aria-label="Free 60-second Quote">
                Free 60-second Quote
              </UiLink>
              <UiLink
                href="tel:19418664320"
                className="h-11 mt-2 rounded-xl border border-slate-200 grid place-items-center hover:bg-slate-50"
                aria-label="Call SonShine Roofing">
                (941) 866-4320
              </UiLink>
            </div>

          </aside>
        </div>

        <div data-toc-exclude>
          <YouMayAlsoLike
            posts={pool}
            category="roof-replacement-services"
            excludeSlug={''}
          />
        </div>

      </Section>
    </>
  );
}
