import Section from "@/components/layout/Section";
import AcculynxLeadForm from "@/components/AcculynxLeadForm";
import LeadForm from "@/components/LeadForm";
import SmartLink from "@/components/SmartLink";
import { Phone, Mail, MapPin, ShieldCheck, BadgeCheck, Banknote, Star, CalendarDays, MapPinned } from "lucide-react";
import Image from 'next/image';
import SocialMediaProfiles from "@/components/SocialMediaProfiles";
import type { Metadata } from 'next';
import LiteMap from "@/components/LiteMap";
import OpenOrClosed from "@/components/OpenOrClosed";
import ResourcesQuickLinks from "@/components/ResourcesQuickLinks";
import FinancingBand from "@/components/FinancingBand";
import { Suspense } from 'react';

// ===== STATIC SEO FOR /contact-us (EDIT HERE) =====
const SEO_TITLE_CONTACT = 'Contact SonShine Roofing | Sarasota Roofing Company';
const SEO_DESCRIPTION_CONTACT =
  'Call (941) 866-4320 or send a message — our team responds quickly during business hours. Serving Sarasota, Manatee & Charlotte Counties since 1987.';
const SEO_KEYWORDS_CONTACT = [
  'contact',
  'phone',
  'address',
  'email',
  'map',
  'Sarasota roofing',
  'Manatee County roofing',
  'Charlotte County roofing',
  'roof repair',
  'roof replacement'
];
const SEO_CANONICAL_CONTACT = '/contact-us';
const SEO_OG_IMAGE_DEFAULT = '/og-default.png';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_CONTACT,
    description: SEO_DESCRIPTION_CONTACT,
    keywords: SEO_KEYWORDS_CONTACT,
    alternates: { canonical: SEO_CANONICAL_CONTACT },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_CONTACT,
      description: SEO_DESCRIPTION_CONTACT,
      url: SEO_CANONICAL_CONTACT,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_CONTACT,
      description: SEO_DESCRIPTION_CONTACT,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

const contactInfoPillStyles = "not-prose inline-flex w-full sm:w-auto max-w-full items-center gap-3 rounded-full border border-slate-400 bg-white px-4 py-2 shadow-sm text-left text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 whitespace-normal break-words overflow-hidden";
const contactInfoIconStyles = "h-5 w-5 shrink-0 text-[--brand-blue]";
const h1Styles = "text-3xl md:text-5xl text-slate-900";
const h2Styles = "text-xl md:text-2xl text-slate-800";
const pStyles = "text-md py-2 text-slate-700";
const badgeStyles = "badge badge--accent inline-flex items-center gap-2";

export default function Page() {
  return (
    <Section>
      <div className="container-edge py-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start max-w-full">
          {/* Main content */}
          <div className="prose max-w-full min-w-0">
            <h1 className={h1Styles}>Contact Us</h1>
            {/* Trust strip */}
            <div className="mt-4 not-prose items-center">
              <div className="flex flex-wrap items-center justify-start gap-2 text-sm font-medium text-slate-700">
                <span className={badgeStyles}>
                  <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
                  Licensed &amp; Insured
                </span>
                <span className={badgeStyles}>
                  <BadgeCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
                  Warranty
                </span>
                <span className={badgeStyles}>
                  <Banknote className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
                  Financing
                </span>
                <span className={badgeStyles}>
                  <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  4.8 on Google
                </span>
              </div>
            </div>

            {/* “You'll talk to…” human tile */}
            <div className="mt-6 not-prose rounded-xl border border-slate-300 bg-white p-6 shadow-md max-w-full">
              <OpenOrClosed />
              <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] mt-8 gap-4 items-center min-w-0">
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/Tara-Project-Support.webp"
                  alt="Tara – Project Support Specialist"
                  width={150}
                  height={429}
                  sizes="(max-width: 150px) 20vw, 300px"
                  className="mb-2 block h-24 w-auto rounded-full object-cover"
                />
                <div>
                  <p className="text-md font-semibold text-slate-900">
                    You’ll likely talk to <SmartLink className="text-[--brand-blue] hover:underline" href="/person/tara">Tara.</SmartLink>
                  </p>
                  <p className="text-md text-slate-600">She’s friendly, fast, and hates leaks.</p>
                </div>
              </div>
              {/* Phone */}
              <div className="my-8 flex flex-wrap gap-3">
                <SmartLink
                  href="tel:+19418664320"
                  className={`${contactInfoPillStyles} w-full phone-affordance`}
                  title="Call SonShine Roofing"
                  proseGuard
                >
                  <Phone className={`${contactInfoIconStyles} phone-affordance-icon`} aria-hidden="true" />
                  <span className="font-semibold min-w-0 break-words">(941) 866-4320</span>
                </SmartLink>

                {/* Email */}
                <SmartLink
                  href="mailto:messages@sonshineroofing.com"
                  className={`${contactInfoPillStyles} w-full`}
                  title="Email SonShine Roofing"
                  proseGuard
                >
                  <Mail className={contactInfoIconStyles} aria-hidden="true" />
                  <span className="font-semibold min-w-0 break-words">messages@sonshineroofing.com</span>
                </SmartLink>

                {/* Address */}
                <SmartLink
                  href="https://www.google.com/maps/place/?q=place_id:ChIJIyB9mBBHw4gRWOl1sU9ZGFM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${contactInfoPillStyles} w-full`}
                  title="Open in Google Maps"
                  proseGuard
                >
                  <MapPin className={contactInfoIconStyles} aria-hidden="true" />
                  <span className="font-semibold min-w-0 break-words">2555 Porter Lake Dr STE 109, Sarasota, Florida 34240</span>
                </SmartLink>
              </div>

              <h2 className={h2Styles}>Whatever you need, we've got you covered.</h2>
              <p className={pStyles}>Whether you need to schedule an appointment with one our
                expert Roofing Specialists to come to your home, or if you
                just have a few questions, we’re here to help! Give us a call
                or complete the form below to contact our office.
              </p>
            </div>

            <FinancingBand />


            <div className="mt-8">
              <h2 className="top-24 flex items-center gap-2" id="book-an-appointment">
                <CalendarDays className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <span>Contact Our Office</span>
              </h2>
              <p className="text-slate-700 text-sm pb-2">
                We respond within 30 minutes during business hours
              </p>
              <AcculynxLeadForm />
              <Suspense
                fallback={(
                  <div className="mt-8 min-h-[420px] rounded-3xl border border-blue-100 bg-white/70 p-8 shadow-sm" aria-busy="true" aria-live="polite">
                    <p className="text-sm font-semibold text-slate-500">Loading your guided request form…</p>
                  </div>
                )}
              >
              </Suspense>
              <div className="text-xs text-slate-500 py-4 italic">
                By submitting this form, you agree to receive SMS messages from Sonshine Roofing
                and its agents. Message frequency may vary. Message and data rates may apply.
                Reply STOP to opt out at any time. For more information, <SmartLink href="/privacy-policy">view our privacy policy.</SmartLink>
              </div>
            </div>
          </div>

          {/* Floating/sticky */}
          <aside className="lg:sticky top-16 self-start lg:h-fit">
            <SocialMediaProfiles />
            <ResourcesQuickLinks />
          </aside>

        </div>
        <div className="my-24">
          <h2 className="text-2xl md:text-5xl mb-16 text-center flex items-center justify-center gap-3">
            <span>Find Us on Google Maps</span>
            <MapPinned className="h-6 w-6 md:h-12 md:w-12 inline text-[--brand-blue]" aria-hidden="true" />
          </h2>
          <LiteMap />
        </div>

      </div>
    </Section>
  );
}
