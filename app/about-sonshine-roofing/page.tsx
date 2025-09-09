import Section from "@/components/layout/Section";
import { AboutVideo } from "./AboutVideo";
import { listPersons, listPersonsBySlugs } from '@/lib/wp';
import PersonGrid from "./PersonGrid";
import SocialMediaProfiles from "@/components/SocialMediaProfiles";
import { HoursAndInformation } from "./HoursAndInformation";
import { UserRoundSearch, CloudRainWind, ChevronDown, BadgeCheck, ShieldCheck, ExternalLink, ChevronRight } from "lucide-react";

const ORDER: string[] = [
  'nathan-borntreger',
  'angela',
  'bob',
  'dean',
  'adam',
  'josh',
  'tony',
  'jb',
  'jeremy-k',
  'tara',
  'robert',
  'matthew',
  'mina',
  'steve',
  'michael'
];

const detailsStyles = "group not-prose rounded-xl border border-slate-400 bg-white mb-4";
const summaryStyles = "flex items-center justify-between cursor-pointer select-none p-4";

export default async function Page() {
  const people = ORDER.length
    ? await listPersonsBySlugs(ORDER)
    : await listPersons(20);

  return (
    <>
      <Section>
        <div className="container-edge py-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">

            {/* About us */}
            <div className="py-4 prose w-full">
              <h1>About SonShine Roofing</h1>

              {/* Credentials pill strip */}
              <div className="not-prose mt-2 mb-2 flex flex-wrap items-center gap-2">
                <a
                  href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Florida contractor license #CCC1331483 on myfloridalicense.com (opens in a new tab)"
                  className="btn btn-outline btn-sm inline-flex items-center"
                >
                  <BadgeCheck className="mr-1 inline h-4 w-4 align-[-0.125em] text-[--brand-blue]" aria-hidden="true" />
                  <span>License #CCC1331483</span>
                  <ExternalLink className="ml-1 inline h-3 w-3 align-[-0.125em]" aria-hidden="true" />
                </a>
                <a
                  href="/docs/sonshine-liability-insurance.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View SonShine Roofing liability insurance certificate (PDF) in a new tab"
                  className="btn btn-outline btn-sm inline-flex items-center"
                >
                  <ShieldCheck className="mr-1 inline h-4 w-4 align-[-0.125em] text-[--brand-blue]" aria-hidden="true" />
                  <span>Proof of Insurance (PDF)</span>
                  <ExternalLink className="ml-1 inline h-3 w-3 align-[-0.125em]" aria-hidden="true" />
                </a>
              </div>

              <div className="mb-8">Jump to: <a href="#hours-and-information" className="underline underline-offset-2">Hours and Information</a></div>

              <details open className={detailsStyles}>
                <summary className={summaryStyles}>
                  <span className="flex items-center gap-2">
                    <UserRoundSearch className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                    <h2 className="m-0 text-lg font-semibold">Who we are</h2>
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="px-4 pb-4">
                  <p>
                    SonShine Roofing is a family-owned roofing company based in Sarasota, Florida,
                    serving Sarasota, Manatee, and Charlotte County residents with 38+ years of experience.
                    We specialize in residential roofing services, including roof repair, roof replacement,
                    inspections, and our Roof Care Club, which is our preventative maintenance program designed
                    for the unique weather conditions of Southwest Florida.
                    <br /><br />
                    We’ve learned that superior customer service and honesty with clients are the only way to
                    stay in business. When you ask us to inspect your roof, we’ll tell you the flat-out truth
                    and give you our best recommendation based on our 38+ years of professional experience.
                    We’d be more than pleased to have you look through our client referrals.
                  </p>
                </div>
              </details>

              <details className={detailsStyles}>
                <summary className={summaryStyles}>
                  <span className="flex items-center gap-2">
                    <CloudRainWind className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                    <h2 className="m-0 text-lg font-semibold">Built for Florida&apos;s Weather</h2>
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="prose">
                    Unlike storm-chasing contractors, SonShine Roofing is rooted in the Sarasota community.
                    Since we are keenly attuned to unpredictable nature of hurricane season, we focus on
                    quality over quick fixes, offering durable, Florida-ready roofing solutions backed by
                    manufacturer warranties and our own workmanship 30-year Leak Free Guarantee.
                    <br /><br />
                    When you choose SonShine Roofing, you are showing that you value honesty,
                    integrity, reliable service, and unbeatable quality. We trust that you’ll make the
                    right choice.
                  </p>
                </div>
              </details>

              <AboutVideo />

              <div className="not-prose">
                <h2 id="meet-our-team" className="text-center mt-12 mb-8 meet-our-team scroll-mt-8">Meet Our Team</h2>
                <div className="gradient-divider my-4" />
                <PersonGrid people={people} />
              </div>

            </div>

            <div className="lg:sticky lg:top-24 self-start min-w-0">            
              <SocialMediaProfiles />
            </div>

          </div>
        </div>
      </Section>

      <HoursAndInformation />
    </>
  );
}
