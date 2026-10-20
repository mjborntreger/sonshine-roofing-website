import type { Metadata } from 'next';

export const revalidate = false;
export const dynamic = 'force-static';
import { Suspense } from 'react';
import Section from '@/components/layout/Section';
import {
  LandingCta,
  LandingHero,
  LandingReviews,
  LandingSection,
  LandingTrust,
} from '@/components/landing/LandingSections';
import FinancingProviders from '@/components/landing/financing/FinancingProviders';
import EvenSimplerLeadForm from '@/components/lead-capture/lead-form/EvenSimplerLeadForm';
import StaticImage from '@/components/media/StaticImage';
import type { Review } from '@/components/reviews-widget/types';
import SmartLink from '@/components/utils/SmartLink';
import { getGoogleReviews } from '@/lib/content/directus-reviews';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';

const LANDING_PATH = '/landing/financing';
const CTA_LABEL = 'Request My Estimate & Financing Options';

export async function generateMetadata(): Promise<Metadata> {
  return getWebsitePageMetadata({
    title: 'Roof Replacement Financing & Free Estimate | SonShine Roofing',
    description:
      'Request a free roof replacement estimate and discuss Ygrene and Service Finance options with SonShine Roofing. Financing is subject to provider approval.',
    path: LANDING_PATH,
    robots: { index: false, follow: true },
  });
}

function selectReplacementReviews(reviews: Review[]): Review[] {
  const preferredNames = ['Charlie', 'Bob P.', 'Susan A.'];
  const relevant = reviews.filter((review) =>
    /(?:new roof|replacing our roof|roof replacement|replaced (?:our|my|the) roof)/i.test(review.text),
  );
  const preferred = preferredNames.flatMap((name) =>
    relevant.filter((review) => review.author_name === name),
  );
  return [...preferred, ...relevant.filter((review) => !preferred.includes(review))].slice(0, 3);
}

const steps = [
  {
    title: 'Start with your roof',
    text: 'Send your request. We’ll contact you within 30 minutes during business hours, or the next business day after hours, to arrange your free replacement estimate.',
  },
  {
    title: 'Understand the project and options',
    text: 'Review the recommended roof, project scope and estimate with our team. We’ll explain how to explore the available financing programs.',
  },
  {
    title: 'Choose your next step',
    text: 'If you decide to apply, complete the provider’s separate application and review its full terms. Approval comes from the provider before you finalize financing.',
  },
];

export default async function FinancingLandingPage() {
  const reviews = selectReplacementReviews(await getGoogleReviews());

  return (
    <>
      <LandingHero
        eyebrow="Roof replacement financing"
        title="Explore financing for your roof replacement."
        description="Start with a free roof replacement estimate. Our team will help you understand the project and discuss financing through Ygrene and Service Finance, so you can decide your next step."
        imageKey="financing-options-couple-wide"
        ctaLabel={CTA_LABEL}
      />
      <LandingTrust />

      <Section className="bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <Suspense
            fallback={
              <p className="rounded-2xl border border-blue-100 bg-white p-6 text-slate-700">
                Loading your estimate request form…
              </p>
            }
          >
            <EvenSimplerLeadForm
              projectType="retail"
              page={LANDING_PATH}
              title="Free Replacement Estimate & Financing Options"
              titleHighlight="Free Replacement Estimate"
              description="Tell us about your roof and the best way to reach you. This is a request to speak with SonShine, not a credit application. Submitting this form does not check your credit or approve financing."
              submitLabel={CTA_LABEL}
            />
          </Suspense>
        </div>
      </Section>

      <LandingSection
        eyebrow="Understand your options"
        title="Two financing paths for your new roof"
        id="financing-options"
      >
        <FinancingProviders />
      </LandingSection>

      <LandingSection
        eyebrow="What happens next"
        title="Get the estimate first. Make an informed decision."
        className="bg-slate-50"
      >
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-blue-100 bg-white p-6">
              <span className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-[--brand-blue]">
                {index + 1}
              </span>
              <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </LandingSection>

      <LandingSection eyebrow="Your roof comes first" title="A roofing team to guide the whole project">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <StaticImage
            src="static:red-tile-roof-white-home"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
            crop
          />
          <div>
            <p className="text-lg leading-relaxed text-slate-700">
              Financing is one part of replacing a roof. You also need to know what will be installed,
              how the work will be handled and who will answer your questions.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              SonShine walks you through roof materials, installation, cleanup and the warranty
              information for your chosen system. Start with a conversation about your home.
            </p>
            <SmartLink
              href="#book-an-appointment"
              className="btn btn-brand-blue mt-6 min-h-12 whitespace-normal px-5 py-3 text-center"
              proseGuard
            >
              {CTA_LABEL}
            </SmartLink>
          </div>
        </div>
      </LandingSection>

      <LandingReviews reviews={reviews} title="What homeowners say about their new roofs" />

      <LandingSection title="Questions about roof financing">
        <div className="mx-auto max-w-4xl divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-white px-6">
          <details className="py-5">
            <summary className="cursor-pointer text-lg font-semibold text-slate-900">
              Is the roof replacement estimate free?
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">
              Yes. SonShine’s roof replacement estimates are always free. You can discuss financing
              options as part of that conversation before deciding whether to apply.
            </p>
          </details>
          <details className="py-5">
            <summary className="cursor-pointer text-lg font-semibold text-slate-900">
              Will this form check my credit?
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">
              No. This form requests a roofing estimate and a conversation with SonShine. Any
              financing application is separate and follows the provider’s requirements. We do not
              ask for your Social Security number, income documents or banking details here.
            </p>
          </details>
          <details className="py-5">
            <summary className="cursor-pointer text-lg font-semibold text-slate-900">
              Is financing available for every property?
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">
              Availability depends on the property, project and provider. Ygrene PACE financing is
              only available in participating locations and has property and repayment requirements.
              Service Finance also requires lender approval. Our team can help you understand the
              next step for your replacement project.
            </p>
          </details>
          <details className="py-5">
            <summary className="cursor-pointer text-lg font-semibold text-slate-900">
              What if I sell or refinance a home with Ygrene financing?
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">
              Ygrene explains that most mortgage lenders require the remaining PACE assessment to be
              paid off at sale or refinance. Discuss those plans with your lender before choosing
              PACE financing.{' '}
              <SmartLink
                href="https://ygrene.com/faq/"
                className="text-[--brand-blue] underline underline-offset-4"
                showExternalIcon
              >
                Read Ygrene’s explanation
              </SmartLink>
              .
            </p>
          </details>
        </div>
      </LandingSection>

      <LandingCta
        title="Know the roof. Understand the options."
        description="Request your free roof replacement estimate and ask our team about financing. We’ll follow up within 30 minutes during business hours, or the next business day after hours."
        ctaLabel={CTA_LABEL}
      />
    </>
  );
}
