import type { Metadata } from 'next';

export const revalidate = false;
export const dynamic = 'force-static';
import { Suspense } from 'react';
import { Check, ChevronDown, ClipboardList, HardHat, Layers } from 'lucide-react';
import Section from '@/components/layout/Section';
import StaticImage from '@/components/media/StaticImage';
import EvenSimplerLeadForm from '@/components/lead-capture/lead-form/EvenSimplerLeadForm';
import {
  LandingCta,
  LandingHero,
  LandingReviews,
  LandingSection,
  LandingTrust,
} from '@/components/landing/LandingSections';
import type { Review } from '@/components/reviews-widget/types';
import { getGoogleReviews } from '@/lib/content/directus-reviews';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';
import { getProjectBySlug } from '@/lib/content/projects';
import { staticImage } from '@/lib/content/static-media';

const LANDING_PATH = '/landing/roof-replacement';
const CTA_LABEL = 'Request My Free Estimate';
const PREFERRED_REVIEWERS = ['Charlie', 'Bob P.', 'Susan A.'];

function selectReplacementReviews(reviews: Review[]): Review[] {
  const eligible = reviews.filter((review) => review.rating === 5 && review.text.trim());
  const preferred = PREFERRED_REVIEWERS.flatMap((name) => {
    const review = eligible.find((item) => item.author_name === name);
    return review ? [review] : [];
  });
  const relevant = eligible.filter(
    (review) =>
      !preferred.includes(review) &&
      /(?:new roof|roof replacement|replacing (?:our|my|the) roof)/i.test(review.text) &&
      !/(?:original roofer|another (?:company|roofer)|roof vents?)/i.test(review.text),
  );
  return [...preferred, ...relevant].slice(0, 3);
}

export async function generateMetadata(): Promise<Metadata> {
  const hero = staticImage('red-tile-roof-white-home');
  return getWebsitePageMetadata({
    path: LANDING_PATH,
    title: 'Free Roof Replacement Estimate | SonShine Roofing',
    description:
      'Plan your roof replacement with SonShine Roofing. Get a free estimate, compare roofing materials and discuss the next steps for your home.',
    robots: { index: false, follow: true },
    image: {
      url: hero.url,
      width: hero.width,
      height: hero.height,
      alt: hero.description,
    },
  });
}

const steps = [
  {
    icon: ClipboardList,
    title: 'Start with your roof',
    description:
      'Tell us what has you considering replacement. We arrange an assessment and explain the condition of your roof and the work it needs.',
  },
  {
    icon: Layers,
    title: 'Choose with a clear estimate',
    description:
      'Compare materials and review the proposed work, cost and warranty details with a Roofing Specialist before deciding how to move forward.',
  },
  {
    icon: HardHat,
    title: 'Know what happens next',
    description:
      'Once approved, our team handles permits and scheduling, protects the work area, installs your roof and completes the final inspection and cleanup.',
  },
];

const faqs = [
  {
    question: 'Is the roof replacement estimate free?',
    answer:
      'Yes. Roof replacement estimates are always free. Send your request and our team will contact you to discuss your roof and arrange the next step.',
  },
  {
    question: 'What if I am not sure my roof needs replacing?',
    answer:
      'You can still request an estimate. Tell us about the leaks, damage or other concerns you have. A Roofing Specialist will assess the roof and discuss whether replacement is appropriate.',
  },
  {
    question: 'Which roofing materials can I choose?',
    answer:
      'SonShine installs shingle, tile, metal and flat roofing systems. Your roof structure, budget and preferences help determine which options fit your home.',
  },
  {
    question: 'Can I discuss financing with my estimate?',
    answer:
      'Yes. Mention financing in the optional message field or ask your Roofing Specialist when we contact you. Available programs, eligibility and terms are determined by the financing provider.',
  },
  {
    question: 'When will I hear from you?',
    answer:
      "We respond within 30 minutes during business hours. After hours, we'll contact you the next business day. Your request starts a conversation; an appointment and installation date are confirmed with our team.",
  },
];

export default async function RoofReplacementLandingPage() {
  const [reviews, tileProject, shingleProject] = await Promise.all([
    getGoogleReviews(),
    getProjectBySlug('western-pine-circle-sarasota-fl'),
    getProjectBySlug('spinnaker-blvd-englewood-fl'),
  ]);
  const projects = [tileProject, shingleProject].filter(
    (project): project is NonNullable<typeof project> => Boolean(project?.heroImage),
  );

  return (
    <>
      <LandingHero
        eyebrow="Residential roof replacement"
        title="A new roof starts with a clear, free estimate."
        description="Understand your options before you make a big decision. Our local team will help you choose the right roofing system and walk you through the work, from the first assessment to the final cleanup."
        imageKey="red-tile-roof-white-home"
        ctaLabel={CTA_LABEL}
      />
      <LandingTrust />

      <Section className="bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<p className="text-center text-slate-600">Loading your estimate form…</p>}>
            <EvenSimplerLeadForm
              projectType="retail"
              page={LANDING_PATH}
              title="Get Your Free Roof Replacement Estimate"
              titleHighlight="Roof Replacement"
              description="We respond within 30 minutes during business hours. After hours, we'll contact you the next business day."
              submitLabel={CTA_LABEL}
            />
          </Suspense>
        </div>
      </Section>

      {projects.length > 0 && (
        <LandingSection eyebrow="Local work, real homes" title="See the difference a new roof makes.">
          <p className="mb-7 max-w-2xl text-lg text-slate-600">
            These completed SonShine projects show two of the roofing options available for your
            home. We help you compare the details that matter for your property.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <figure
                key={project.slug}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="relative aspect-[4/3]">
                  <StaticImage
                    src={project.heroImage!.url}
                    alt={project.heroImage!.altText}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                    loading="lazy"
                  />
                </div>
                <figcaption className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {project.materialTypes.map((material) => material.name).join(' / ')} roof replacement
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </LandingSection>
      )}

      <LandingReviews
        reviews={selectReplacementReviews(reviews)}
        title="What homeowners say about their new roofs"
      />

      <LandingSection eyebrow="A straightforward process" title="A plan you can follow, from start to finish.">
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <Icon className="h-8 w-8 text-[--brand-blue]" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </LandingSection>

      <LandingSection className="bg-slate-50" title="Look beyond the shingles, tile or metal.">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-6 text-lg text-slate-600">
              Your new roof is a complete system. We explain the materials and installation details
              together so you know what you are choosing.
            </p>
            <ul className="space-y-4">
              {[
                'Material options that suit your home and budget.',
                'Underlayment, flashing and ventilation considered together.',
                'Warranty details for your selected materials and installation.',
                'Financing options to discuss with your Roofing Specialist.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[--brand-blue]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <StaticImage
              src="static:tile-shingle-metal-roof-comparison"
              fill
              crop
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 600px"
              loading="lazy"
            />
          </div>
        </div>
      </LandingSection>

      <LandingSection eyebrow="Before you request an estimate" title="A few common questions">
        <div className="mx-auto max-w-4xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
          {faqs.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronDown className="h-5 w-5 shrink-0 text-[--brand-blue] transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </LandingSection>

      <LandingCta
        title="Make your next roofing decision with confidence."
        description="Start with a free estimate and a conversation about your home. We'll help you understand the options and the next steps."
        ctaLabel={CTA_LABEL}
      />
    </>
  );
}
