import Section from "@/components/layout/Section";
import Image from "next/image";
import SmartLink from "@/components/utils/SmartLink";
import { listRecentPostsPool, listFaqsWithContent } from "@/lib/content/wp";
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import YouMayAlsoLike from "@/components/engagement/YouMayAlsoLike";
import { Accordion } from "@/components/ui/Accordion";
import { Layers, Droplets, Bug, Hammer, PanelRight, CircleCheckBig, Rabbit, HandCoins, Ban, HardHat } from "lucide-react";
import RepairVsReplace from "@/components/marketing/service-pages/RepairVsReplace";
import type { Metadata } from "next";
import FinancingBand from "@/components/cta/FinancingBand";
import ServicesAside from "@/components/global-nav/static-pages/ServicesAside";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";
import Hero from "@/components/ui/Hero";

const figureStyles = "not-prose py-8";
const ACCORDION_TITLE = "text-xl";
const SERVICE_PATH = "/roof-repair";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Roof Repair | SonShine Roofing",
      description: "Roof repair services from SonShine Roofing.",
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
  const [pool, faqs] = await Promise.all([
    listRecentPostsPool(36),
    listFaqsWithContent(8, "roof-repair").catch(() => []),
  ]);
  const origin = SITE_ORIGIN;
  const config = SERVICE_CONFIG;

  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Roof Repair", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "Roof Repair",
    description: config?.description,
    url: SERVICE_PATH,
    origin,
    primaryImage: config?.image?.url ?? "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png",
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: origin },
  });

  const breadcrumbsLd = breadcrumbSchema(
    breadcrumbsConfig.map((crumb) => ({
      name: crumb.name,
      item: crumb.path,
    })),
    { origin },
  );

  return (
    <>
    <Hero
    title="Roof Repair"
    eyelash="Residential Roof Repair Services in Sarasota, FL and Surrounding Areas"
    subtitle="We are committed to extending the lifespan of your current roof above all else. We perform fast, lasting roof repair for leaks, flashing, fascia and storm/wind damage."
    justifyStart
    badges={[
      { icon: Rabbit, label: "Fast Response" },
      { icon: HandCoins, label: "Affordable Pricing" },
      { icon: HardHat, label: "Expert Opinion" },
      { icon: Ban, label: "No BS" },
    ]}
    imageSrc="https://next.sonshineroofing.com/wp-content/uploads/Light-Repairs-Inspection-and-Maintenance.webp"
    />
      <Section>
        <div className="grid gap-4 px-2 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div id="article-root" className="prose min-w-0">
            {/* JSON-LD: WebPage + BreadcrumbList */}
            <JsonLd data={webPageLd} />
            <JsonLd data={breadcrumbsLd} />

            <h2 className="mt-0">What Does It Cost to Repair a Roof?</h2>
            <div className="my-4 rounded-xl border border-[#fb9216]/30 bg-[#fb9216]/5 p-4" role="note" aria-label="Important">
              <strong
                className="block font-display uppercase text-slate-800 mb-1"
              >
                <CircleCheckBig className="h-4 w-4 mr-2 inline text-[--brand-blue]" />
                Fact:
              </strong>
              <p className="m-0 text-slate-700">
                Repairing parts of a roof will cost considerably less than a full-on
                replacement of the entire system.
              </p>
            </div>
            <p>
              Roof leak repair costs vary depending on several factors, including
              the extent of the damage, the type of materials needed, any special
              equipment, and the geographic location of the home. Elements such as
              flashing, sheathing, underlayment, and gutters may also need attention
              when addressing problem areas—these should all be considered when
              estimating the true repair cost.
              <br></br><br></br>
              <SmartLink href="/contact-us">Contact us</SmartLink> to help identify your roofing
              issues and determine repair costs accurately.
              <br></br><br></br>
              For guidance on assessing roofing needs, see the <a href="https://www.hud.gov/program_offices/healthy_homes">
                HUD inspection checklist </a>for homeowners and contractors.
            </p>

            <FinancingBand />

            <h2>Common Roof Repairs</h2>
            <Accordion
              icon={<Layers className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className={ACCORDION_TITLE}>Curling Shingles</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}

            >
              <p>
                When shingles begin to curl, fall off, or show signs of discoloration,
                it’s time to schedule a roof repair. Missing or damaged shingles expose
                the underlying wood to moisture, which can lead to rot, holes, and other
                structural problems.
              </p>
              <figure className={figureStyles}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/curling-Shingles-on-roof.jpg"
                    alt="Curling Shingles Roof Repair"
                    fill
                    className="object-cover mb-2"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                  />
                </div>
              </figure>
              <p>
                Discoloration may also indicate that the shingles are shedding their protective
                granules—a common sign that your roof is nearing the end of its effective life.
                These granules help defend against UV rays and weather damage, so their loss
                compromises the entire system.
                <br></br><br></br>
                According to the <a href="https://www.epa.gov/smm/sustainable-management-construction-and-demolition-materials">U.S. Environmental Protection Agency
                </a>, shingle degradation and wear can significantly affect roof performance and energy efficiency.
              </p>
            </Accordion>
            <Accordion
              icon={<Droplets className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className={ACCORDION_TITLE}>Water Damage</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}

            >
              <p>
                Missing or failing gutters allow water and debris to accumulate along the edges
                of your roof. Without proper drainage, this moisture can seep beneath shingles
                and underlayment, eventually damaging the wood decking and support structures.
              </p>
              <figure className={figureStyles}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/roofer-roof-maintenance.jpg"
                    alt="Water Damage Roof Repair"
                    fill
                    className="object-cover mb-2"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                  />
                </div>
              </figure>
              <p>
                Over time, trapped water leads to the growth of mold and mildew, which not only
                compromises the roof’s integrity but can also impact indoor air quality. Consistent
                water exposure can rot fascia boards, weaken roof joints, and shorten the lifespan
                of the entire roofing system. Maintaining functional gutters is a key part of regular
                roof maintenance and is essential for protecting your home from long-term water damage.
              </p>
            </Accordion>
            <Accordion
              icon={<Bug className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className={ACCORDION_TITLE}>Insect Damage</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}

            >
              <p>
                Cracks, rot, and holes around the soffit of a home are more than just cosmetic
                issues—they’re an open invitation to pests. Insects, rodents, and even small
                birds can use these vulnerable points to access your attic or wall spaces. Once
                inside, they can cause extensive damage to insulation, wiring, and wood framing
                in a short period of time.
                <SmartLink href="/roof-inspection">Regular roof inspections</SmartLink> can help detect
                these problems early, and preventive maintenance ensures your soffits stay sealed
                and secure year-round.
              </p>
              <figure className={figureStyles}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/roof-insect-damage-repair.jpg"
                    alt="Insect Damage Roof Repair"
                    fill
                    className="object-cover mb-2"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                  />
                </div>
              </figure>
              <p>
                According to the <a href="https://www.cdc.gov/">Centers for Disease Control and Prevention (CDC)</a>
                , rodents can enter through openings as small as a dime, making even minor soffit
                deterioration a serious entry risk.
              </p>
            </Accordion>
            <Accordion
              icon={<Hammer className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className={ACCORDION_TITLE}>Worn Out or Damaged Flashings</h3>}
              className="mb-4"
              radius="2xl"
              proseBody={false}

            >
              <p>
                Flashing is one of the most common areas of concern on a roofing system.
                It’s typically installed around roof penetrations such as chimneys, vents,
                skylights, and where the roof meets vertical walls. Its purpose is to direct
                water away from seams and joints. However, flashing can deteriorate over
                time due to exposure to the elements, oxidation, or simply coming loose from
                thermal movement or improper installation. Damaged or dislodged flashing allows
                water to seep beneath the roofing surface, potentially causing interior leaks,
                wood rot, and structural damage.
              </p>
              <figure className={figureStyles}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/damaged-vent-flashing-scaled.jpg"
                    alt="Worn out or damaged flashing roof repair"
                    fill
                    className="object-cover mb-2"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                  />
                </div>
              </figure>
              <p>
                That’s why <SmartLink href="/roof-inspection">routine roof inspections</SmartLink> are
                essential—they help identify vulnerable flashing areas before they fail. If damage
                is found, our team can address it promptly through targeted roof repair or complete
                roof replacement when necessary.
                <br></br><br></br>
                For more information on proper flashing installation and maintenance, visit
                this <a href="https://www.nachi.org/roof-inspection.htm">InterNACHI guide to roof flashing.</a>
              </p>
            </Accordion>
            <Accordion
              icon={<PanelRight className="h-7 w-7" aria-hidden="true" />}
              summary={<h3 className={ACCORDION_TITLE}>Rotting Fascia</h3>}
              className="mb-6"
              radius="2xl"
              proseBody={false}

            >
              <p>
                Moisture is one of the most common causes of fascia damage. The fascia is the
                horizontal board that runs along the edge of your roof, directly behind the gutter
                system. Its main function is to act as a protective barrier between the edge of the
                roof and the elements, shielding the underlying structure from rain, wind, and debris.
                When water consistently overflows from clogged or broken gutters, or when roofing
                components fail, the fascia can begin to rot, warp, or separate from the home.
              </p>
              <figure className={figureStyles}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/rotten-fascia-scaled.jpg"
                    alt="Rotting fascia roof repair"
                    fill
                    className="object-cover mb-2"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                  />
                </div>
              </figure>
              <p>
                If the fascia deteriorates, water can seep into the roofline and exterior walls,
                eventually reaching the interior of the home. This not only weakens the roof structure
                but can also lead to costly water damage inside your living
                space. <SmartLink href="/roof-inspection">Our roof inspections</SmartLink> and <SmartLink href="/roof-care-club">maintenance services</SmartLink> include
                a full evaluation of fascia boards to ensure early signs of wear or damage
                are caught before they escalate.
              </p>
            </Accordion>

            <RepairVsReplace />

          </div>

          <ServicesAside activePath={SERVICE_PATH} />
        </div>

        <div data-toc-exclude>
          <YouMayAlsoLike
            posts={pool}
            category="roof-repair-services"
            excludeSlug={''}
            heading="Learn More About Roof Repair Services"
          />
        </div>

        {/* FAQs (dynamic) */}
        <FaqInlineList
          heading="Roof Repair FAQs"
          topicSlug="roof-repair"
          limit={8}
          initialItems={faqs}
          seeMoreHref="/faq"
        />

        {/* FAQ Schema */}
      </Section>
    </>
  );
}
