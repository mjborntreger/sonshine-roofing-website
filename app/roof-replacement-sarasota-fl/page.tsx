import Section from "@/components/layout/Section";
import ServicesAside from "@/components/ServicesAside";
import Image from "next/image";
import SmartLink from "@/components/SmartLink";
import { headers } from "next/headers";
import { listRecentPostsPool, listFaqsWithContent } from "@/lib/wp";
import FaqInlineList from "@/components/FaqInlineList";
import YouMayAlsoLike from "@/components/YouMayAlsoLike";
import { Accordion } from "@/components/Accordion";
import { ShieldCheck, Layers, BadgeCheck, Wrench, ListChecks } from "lucide-react";
import RepairVsReplace from "@/components/RepairVsReplace";
import type { Metadata } from 'next';
import FinancingBand from "@/components/FinancingBand";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, howToSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { resolveSiteOrigin } from "@/lib/seo/site";

const figureStyles = "not-prose py-8";
const liStyles = "relative pl-4";
const stepperStyles = "absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-[#0045d7]";

const SERVICE_PATH = "/roof-replacement-sarasota-fl";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Roof Replacement | SonShine Roofing",
      description: "Roof replacement services from SonShine Roofing.",
      path: SERVICE_PATH,
    });
  }

  return buildBasicMetadata({
    title: config.title,
    description: config.description,
    path: SERVICE_PATH,
    keywords: config.keywords,
    image: config.image,
  });
}


export default async function Page() {
  const pool = await listRecentPostsPool(36);
  // Dynamic FAQs for this service topic
  const faqs = await listFaqsWithContent(8, "roof-replacement").catch(() => []);
  const origin = resolveSiteOrigin(await headers());
  const config = SERVICE_CONFIG;

  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Roof Replacement", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "Roof Replacement",
    description: config?.description,
    url: SERVICE_PATH,
    origin,
    primaryImage: config?.image?.url ?? "/og-default.png",
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: origin },
  });

  const breadcrumbsLd = breadcrumbSchema(
    breadcrumbsConfig.map((crumb) => ({
      name: crumb.name,
      item: crumb.path,
    })),
    { origin },
  );

  const howToLd = howToSchema({
    name: "Roof Replacement: What to Expect",
    description:
      "Step-by-step overview of a typical roof replacement from permits through final inspection and warranty.",
    steps: [
      { name: "Permits & Scheduling", text: "We file permits and set your installation date." },
      { name: "Site Prep", text: "We protect landscaping and the home exterior." },
      { name: "Tear-off & Inspection", text: "We remove old materials and inspect decking." },
      {
        name: "Install New Roof",
        text: "Underlayment, flashing, ventilation, and finishing materials are installed.",
      },
      { name: "Final Inspection & Cleanup", text: "We inspect the final install and clean the site." },
      { name: "Warranty & Maintenance", text: "We provide warranty info and maintenance tips." },
    ],
    url: SERVICE_PATH,
    origin,
  });
  return (
    <>
      <Section>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start px-2">
          <div id="article-root" className="prose min-w-0">
            <h1>Roof Replacement</h1>
            {/* JSON-LD: WebPage + BreadcrumbList + HowTo */}
            <JsonLd data={webPageLd} />
            <JsonLd data={breadcrumbsLd} />
            <JsonLd data={howToLd} />

            <h2>How do you know if you need a roof replacement?</h2>
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

            <FinancingBand />

            <h2>What Should You Know Before Getting a Roof Replacement?</h2>
            <Accordion
              icon={<ShieldCheck className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className="text-xl text-slate-800">Know Your Contractor</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}
            >
              <p>
                SonShine Roofing is licensed by the State of Florida as a roofing
                contractor and is fully insured. While state law requires roofers
                to carry a valid license and insurance, neither guarantees quality
                workmanship, real experience, or a long-lasting roof.
              </p>

              <figure className={figureStyles}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/Nathan-Borntreger-Owner-President-Sonshine-Roofing.webp"
                    alt="Nathan Borntreger, owner of SonShine Roofing"
                    fill
                    className="object-cover mb-2"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-3 mx-2 text-xs text-slate-500">
                  <strong>Nathan Borntreger</strong> — Owner of SonShine Roofing • Insured • LIC: #CCC1331483 |{" "}
                  <SmartLink className="hover:underline no-italic text-[--brand-blue]" href="/person/nathan-borntreger">
                    See full bio
                  </SmartLink>
                </figcaption>
              </figure>

              <p>
                We bring over 50 years of combined expertise and hands-on experience
                to your real-world roofing needs. Our roofing crews are true employees
                of SonShine Roofing—not subcontractors—and we invest in their ongoing
                roofing education to keep pace with evolving industry standards.
              </p>
            </Accordion>

            <Accordion
              icon={<Layers className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className="text-xl text-slate-800">Know What Materials You Need</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}
            >
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
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
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
            </Accordion>

            <Accordion
              icon={<BadgeCheck className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className="text-xl text-slate-800">Know What Warranties Come with Your New Roof</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}
            >
                <p>
                  There are usually two types of warranty that come with your new roof: workmanship and manufacturer.
                  <br /><br />
                </p>

                <h4>Workmanship Warranty</h4>
                {/* Inline callout (#6) */}
              <div className="my-4 rounded-3xl border border-[#fb9216]/30 bg-[#fb9216]/5 p-4" role="note" aria-label="Important">
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

              <h4>Manufacturer Warranty</h4>
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

              <h4>Important Note</h4>
              <p>
                As with any contract, always read the fine print before you sign. Be aware that
                warranties typically do not cover anything considered beyond “normal wear and tear.”
                <br /><br />
                For example, if a tree falls on your roof during a hurricane, that is neither the
                manufacturer’s nor the roofer’s fault. Ideally this sort of event would be covered
                by your insurance company.
              </p>
            </Accordion>

            <Accordion
              icon={<Wrench className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className="text-xl text-slate-800">Know the Importance of Roof Maintenance</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}
            >
                <p>
                  A roof replacement is a major investment—but that doesn’t mean your new roof is “set
                  it and forget it.” Regular maintenance is the key to protecting your roof’s longevity
                  and your home’s safety. Even the highest quality roofing materials need routine care
                  to withstand Florida’s heat, storms, and humidity. Without regular checkups, small
                  issues like clogged gutters or cracked flashing can quickly snowball into expensive
                  repairs or premature failure.
                </p>

                <figure className={figureStyles}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
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
              <div className="my-4 rounded-3xl border border-[#fb9216]/30 bg-[#fb9216]/5 p-4" role="note" aria-label="Pro tip">
                <strong className="block text-slate-900 mb-1">Pro tip</strong>
                <p className="m-0 text-slate-700">Annual inspections keep warranties valid and catch small issues before they become leaks.</p>
              </div>
            </Accordion>

            <Accordion
              icon={<ListChecks className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className="text-xl text-slate-800">Know What to Expect</h3>}
              radius="2xl"
              proseBody={false}
            >
              {/* Stepper timeline (#4) */}
              <ol className="my-4 not-prose border-slate-200 pl-6 space-y-4">
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
            </Accordion>

            <RepairVsReplace />

          </div>

          <ServicesAside />
          
        </div>

        <div data-toc-exclude>
          <YouMayAlsoLike
            posts={pool}
            category="roof-replacement-services"
            excludeSlug={''}
          />
        </div>

        {/* FAQs (dynamic) */}
        <FaqInlineList
          heading="Roof Replacement FAQs"
          topicSlug="roof-replacement"
          limit={8}
        initialItems={faqs}
        seeMoreHref="/faq"
      />

    </Section>
  </>
  );
}
