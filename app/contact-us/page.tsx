import Section from "@/components/layout/Section";
import AcculynxLeadForm from "@/components/AcculynxLeadForm";
import SmartLink from "@/components/SmartLink";
import UiLink from "@/components/UiLink";
import { Phone, Mail, MapPin } from "lucide-react";
import SocialMediaProfiles from "@/components/SocialMediaProfiles";
import type { Metadata } from 'next';
import LiteMap from "@/components/LiteMap";


const contactInfoPillStyles = "inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0";
const contactInfoIconStyles = "h-5 w-5 text-slate-500";

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
const SEO_OG_IMAGE_DEFAULT = '/og-default.jpg';

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

const h1Styles = "text-3xl md:text-4xl py-4"
const h2Styles = "text-xl md:text-2xl py-2"
const pStyles = "text-md py-2"

export default function Page() {
  return (
    <Section>
      <div className="container-edge py-4">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start px-2">
          {/* Main content */}
          <div>
            <h1 className={h1Styles}>Contact Us</h1>
            <h2 className={h2Styles}>Whatever you need, we've got you covered</h2>
            <p className={pStyles}>Whether you need to schedule an appointment with one our
              expert Roofing Specialists to come to your home, or if you
              just have a few questions, we’re here to help! Give us a call
              or complete the form below to contact our office.
            </p>

            <h2 className={h2Styles}>Contact Information</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {/* Phone */}
              <UiLink
                href="tel:+19418664320"
                className={contactInfoPillStyles}
                title="Call SonShine Roofing"
              >
                <Phone className={contactInfoIconStyles} aria-hidden="true" />
                <span className="font-semibold">(941) 866-4320</span>
              </UiLink>

              {/* Email */}
              <UiLink
                href="mailto:messages@sonshineroofing.com"
                className={contactInfoPillStyles}
                title="Email SonShine Roofing"
              >
                <Mail className={contactInfoIconStyles} aria-hidden="true" />
                <span className="font-medium">messages@sonshineroofing.com</span>
              </UiLink>

              {/* Address */}
              <UiLink
                href="https://share.google/BO0HyQ8eoe2qcoTDX"
                target="_blank"
                rel="noopener noreferrer"
                className={contactInfoPillStyles}
                title="Open in Google Maps"
              >
                <MapPin className={contactInfoIconStyles} aria-hidden="true" />
                <span className="font-medium">2555 Porter Lake Dr STE 109, Sarasota, Florida 34240</span>
              </UiLink>
            </div>


            <div className="mt-8">
              <h2 id="book-an-appointment">
                Book an Appointment
              </h2>
              <p className="text-xs pb-2">We respond within 30 minutes during business hours</p>
              <AcculynxLeadForm />
              <div className="text-xs py-4 italic">
                By submitting this form, you agree to receive SMS messages from Sonshine Roofing
                and its agents. Message frequency may vary. Message and data rates may apply.
                Reply STOP to opt out at any time. View our
                <SmartLink href="/privacy-policy"> Privacy Policy.</SmartLink>
              </div>
            </div>
          </div>

          {/* Floating/sticky */}
          <SocialMediaProfiles />
        </div>
      <div className="my-24">
        <h2 className="text-3xl md:text-5xl mb-16 text-center">Find Us on Google Maps</h2>
        <LiteMap />
      </div>

      </div>
    </Section>
  );
}
