import Section from "@/components/layout/Section";
import Hero from "@/components/ui/Hero";
import Image from "next/image";
import { ArrowUpRight, ChartSpline, Map, Truck, Zap } from "lucide-react";
import SmartLink from "@/components/utils/SmartLink";
import { VideoWithSchema } from "@/components/utils/VideoWithSchema";

const PLACEHOLDER_IMAGE = "https://next.sonshineroofing.com/wp-content/uploads/Fallback-Hero.webp";

const PRICE = "$75,000"

const comparisonRows = [
  { truck: "GMC Sierra Denali (ProCharged 6.2L)*", drivetrain: "4WD", whp: "~800 whp", crank: "~1,025 - 1,070 hp (est.)" },
  { truck: "Ram TRX*", drivetrain: "4WD", whp: "~580 - 590 whp", crank: "702 hp" },
  { truck: "Ford Raptor R*", drivetrain: "4WD", whp: "~570 - 590 whp", crank: "700 - 720 hp" },
  { truck: "Shelby F-150 Super Snake*", drivetrain: "4WD", whp: "~650 - 700 whp", crank: "~770 - 785 hp" },
];

const buildSheet = [
  {
    title: "Engine & induction",
    items: [
      "6.2L Texas Speed sleeved short block (~1,800 miles)",
      "Texas Speed Stage 3 cam",
      "ProCharger D-1X",
      "Engine built to support a 1,000+ horsepower tune",
    ],
  },
  {
    title: "Fuel & air",
    items: [
      "LT4 injectors",
      "LT4 high pressure fuel pump",
      "Custom in-tank dual fuel pump with new braided fuel lines",
      "Methanol dual spray injection by AlkyControl",
    ],
  },
  {
    title: "Exhaust & sound",
    items: [
      "Kooks long tube headers",
      "Full exhaust by Boral (no cats)",
      "Distinct idle shake, supercharger whine, and rowdy 4WD launches",
    ],
  },
  {
    title: "Driveline & suspension",
    items: [
      "Carbon fiber driveshaft by Gulfcoast Driveshaft",
      "IHC 3/5\" lowering kit with air-adjustable rear bags",
      "Heavy duty tie rods",
      "Traction bars",
    ],
  },
  {
    title: "Transmission",
    items: [
      "Built transmission installed at 43,300 miles by Burks Transmission (Sarasota)",
    ],
  },
  {
    title: "Provenance",
    items: [
      "All engine and performance work completed by K9 Motorworks in Fort Myers",
      "Professionally built with no shortcuts",
      "Other supporting upgrades not listed plus select OEM parts retained",
    ],
  },
];

const galleryImages = [
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/DenaliSideView-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalirear-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalirightside-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalifrontview-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denaliinteriorfront-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denaliinteriorrear-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalimpgproof-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denaliliftgate-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalisupercharger-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denaliunderthehood2-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denaliunderthehood3-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denaliinfotainment2-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalidriveshaft-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalibelow2-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalibelow-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalidocs2-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/denalidocs-ezgif.com-optiwebp.webp" },
  { alt: "", src: "https://next.sonshineroofing.com/wp-content/uploads/Denali-Dynoresults-ezgif.com-optiwebp.webp" },
];

export default async function Page() {
  return (
    <>
      <div id="truck-offer" className="scroll-mt-24">
        <Hero
          title="Performance Truck for Sale"
          subtitle="Real-world 800-wheel-horsepower GMC Sierra Denali that can be driven every day—comfort, 4WD traction, and a professionally built ProCharged 6.2L."
          eyelash="The 'Frankenstein Truck'"
          imageSrc="https://next.sonshineroofing.com/wp-content/uploads/denalileftfront-ezgif.com-optiwebp-1.webp"
          justifyStart
          badges={[
            { icon: Map, label: "53,334 chassis miles" },
            { icon: Truck, label: "4WD" },
            { icon: ChartSpline, label: "~1,025 - 1,070 hp (est.)" },
            { icon: Zap, label: "~800 whp (real)" },
          ]}
        >
          <div className="flex gap-6 flex-wrap max-w-3xl">
            <div>
              <p className="italic text-xl text-slate-300">
                Current Price <span className="text-slate-400 not-italic text-sm">(Cash only, no trades)</span>
              </p>
              <p className="text-blue-400 mt-2 text-5xl">
                {PRICE}
              </p>
              <p className="mt-3 text-sm text-slate-200">
                This is not a truck for joy rides or casual test drives.
              </p>
              <p className="mt-6 text-2xl font-semibold">
                Interested? Call or Text Nathan Borntreger: <SmartLink href="+19417354947" className="text-blue-400 font-bold">(941) 735-4947</SmartLink>
              </p>
            </div>
          </div>
        </Hero>
      </div>

      <Section>
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-8 min-w-0">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-slate-900">Why this truck commands the price</h2>
              <p className="text-base leading-relaxed text-slate-700">
                Some people see the number and think it is a lot for a pickup. They are right—until you compare it to
                what is out there. Ram TRX, Raptor R, and Shelby Super Snake all make brochure horsepower. None of them
                put down what this truck does in the real world: around 800 horsepower at the wheels, backed by 4WD traction
                and a Denali interior you actually want to sit in every day.
              </p>

              <div className="max-w-full overflow-hidden rounded-xl border border-slate-200">
                <VideoWithSchema
                  videoId="aODl4r7ftfc"
                  title="2020 GMC Sierra 1500 Denali"
                  className="w-full rounded-none aspect-[9/16]"
                  query={{ autoplay: 0, mute: 0, controls: 1, loop: 0 }}
                />
              </div>

              <p className="text-base leading-relaxed text-slate-700">
                Plenty of single-cab 5.0 F-150s with twin turbos make huge numbers, but most are not daily-drivable.
                This build is different. It was engineered to live on the road, not on a trailer, and it does it with all
                the factory comforts intact. Drop it into 4WD, feel the truck shake at idle, listen to the supercharger whine
                and the exhaust note, then experience the violence when you get into it—something you will not find from a
                stock truck or stripped-down race build.
              </p>
              <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/denalileftfront-ezgif.com-optiwebp.webp"
                    alt="2020 GMC Sierra 1500 Denali"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 960px"
                    priority
                  />
                </div>
              </div>
              <p className="text-base leading-relaxed text-slate-700">
                Real 800-wheel horsepower, real drivability, and real build quality. You can spend more on a factory badge
                with less power and be average, or choose the combination that does it all.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Performance comparison (real-world)</h3>
                <p className="text-sm text-slate-600">Wheel horsepower numbers matter—brochures do not.</p>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-800">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Truck</th>
                      <th className="px-4 py-2 font-semibold">Drivetrain</th>
                      <th className="px-4 py-2 font-semibold">Wheel Horsepower (real)</th>
                      <th className="px-4 py-2 font-semibold">Crank Horsepower</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {comparisonRows.map((row) => (
                      <tr key={row.truck}>
                        <td className="px-4 py-3 font-semibold">{row.truck}</td>
                        <td className="px-4 py-3">{row.drivetrain}</td>
                        <td className="px-4 py-3">{row.whp}</td>
                        <td className="px-4 py-3">{row.crank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 text-xs text-slate-600">
                * All performance figures are estimates based on dyno results and typical drivetrain loss; vehicle is sold as-is with no warranty expressed or implied.
              </div>
            </div>

            <div className="max-w-full overflow-hidden rounded-xl border border-slate-200">
              <VideoWithSchema
                videoId="85KrYY_U6N4"
                title="2020 GMC Sierra 1500 Denali"
                className="aspect-video"
                query={{ autoplay: 0, mute: 0, controls: 1, loop: 0 }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Built to be driven</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>Daily-driver ready Denali package with every comfort intact.</li>
                  <li>4WD traction that actually hooks—no vaporware horsepower.</li>
                  <li>Engine is built to support 1,000+ horsepower tuning headroom.</li>
                  <li>Sound and feel you cannot buy from a factory badge.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Quick stats</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>2020 GMC Sierra 1500 Denali | 53,334 chassis miles</li>
                  <li>ProCharged 6.2L | ~800 whp | ~1,025 - 1,070 crank hp (est.)</li>
                  <li>Built transmission installed at 43,300 miles (Burks Transmission, Sarasota)</li>
                  <li>All engine/performance work by K9 Motorworks, Fort Myers</li>
                  <li>Professionally built with supporting upgrades beyond this list</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6 sticky self-start top-8 min-w-0">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Truck snapshot</h3>
              <p className="mt-2 text-sm text-slate-700">
                2020 GMC Sierra 1500 Denali — black exterior — professionally built for supertruck performance with full daily usability.
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-800">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                  <p>4WD with the violence you want when you drop it into gear and hit the gas.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                  <p>Denali comfort and refinement—nothing stripped down or compromised.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                  <p>Soundtrack includes the supercharger whine, idle shake, and no-cat exhaust.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <h3 className="text-2xl text-white font-semibold">Price & terms</h3>
              <p className="text-slate-200">
                {`Asking ${PRICE} — cash only — no trades. Vehicle is sold as-is with no warranty expressed or implied.`}
              </p>
              <p className="mt-3 text-slate-200">
                Serious interest only. This is not a truck for joy rides or casual test drives.
              </p>
              <h3 className="mt-6 text-2xl text-white font-semibold">Interested?</h3>
              <p className="mt-3 font-semibold text-white">
                Call or Text Nathan Borntreger: <SmartLink href="tel:+19417354947" className="text-blue-400 font-bold">(941) 735-4947</SmartLink>
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-slate-50">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Build sheet (K9 Motorworks, Fort Myers)</h2>
            <p className="mt-2 text-base text-slate-700">
              All engine and performance work was completed professionally—no shortcuts. Additional supporting upgrades and select OEM parts are included beyond what is listed here.
            </p>
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 my-8">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/denaliunderhood-ezgif.com-optiwebp.webp"
                  alt="2020 GMC Sierra 1500 Denali"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 960px"
                  priority
                />
              </div>
            </div>


            <div className="grid gap-4 md:grid-cols-2">
              {buildSheet.map((section) => (
                <div key={section.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-slate-900">Image gallery</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {galleryImages.map((image, index) => (
            <div key={`${image.alt}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading={index < 3 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-900">
        <div className="flex flex-col items-center gap-4 text-center text-white">
          <p className="text-lg font-semibold">Ready to feel 800 wheel horsepower again?</p>
          <p className="text-sm text-slate-200">Jump back to the price and contact details at the top.</p>
          <SmartLink
            href="#truck-offer"
            className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            Back to the offer
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </SmartLink>
        </div>
      </Section>
    </>
  );
}
