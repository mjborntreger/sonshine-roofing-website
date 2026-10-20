import type { ReactNode } from 'react';
import { ArrowDown, Check, Phone, Quote } from 'lucide-react';
import StaticImage from '@/components/media/StaticImage';
import SmartLink from '@/components/utils/SmartLink';
import type { Review } from '@/components/reviews-widget/types';
import { getSiteSettings } from '@/lib/content/directus-site';
import { cn } from '@/lib/utils';

const container = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

export async function LandingHero({
  eyebrow, title, description, imageKey, ctaLabel,
}: {
  eyebrow: string; title: string; description: string; imageKey: string; ctaLabel: string;
}) {
  const settings = await getSiteSettings();
  return (
    <section className="overflow-hidden border-b border-blue-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className={cn(container, 'grid items-center gap-6 py-8 md:grid-cols-2 md:gap-10 md:py-10')}>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[--brand-blue]">{eyebrow}</p>
          <h1 className="text-4xl leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">{description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <SmartLink href="#book-an-appointment" aria-label={ctaLabel} className="btn btn-brand-blue min-h-12 px-5 py-3 text-center">
              {ctaLabel}<ArrowDown className="ml-2 size-4 shrink-0" aria-hidden="true" />
            </SmartLink>
            <SmartLink href={settings?.phoneHref ?? 'tel:+19418664320'} aria-label={`Call SonShine Roofing at ${settings?.phone ?? '(941) 866-4320'}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700">
              <Phone className="size-4" aria-hidden="true" />{settings?.phone ?? '(941) 866-4320'}
            </SmartLink>
          </div>
          <p className="mt-3 text-sm text-slate-500">For homes in Sarasota, Manatee &amp; Charlotte counties.</p>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-sm md:aspect-[4/3]">
          <StaticImage src={`static:${imageKey.replace(/^static:/, '')}`} fill crop className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" priority />
        </div>
      </div>
    </section>
  );
}

export function LandingTrust() {
  return (
    <div className="border-b border-blue-100 bg-white">
      <ul aria-label="Why homeowners choose SonShine" className={cn(container, 'grid gap-3 py-5 text-sm font-medium text-slate-700 sm:grid-cols-3')}>
        {['Serving local homeowners since 1987', 'Licensed & insured', 'Free repair & replacement estimates'].map((text) => (
          <li key={text} className="flex items-center gap-2">
            <Check className="size-5 shrink-0 text-[--brand-blue]" aria-hidden="true" />{text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingSection({ eyebrow, title, children, className, id }: {
  eyebrow?: string; title: string; children: ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={cn('py-10 md:py-14', className)}>
      <div className={container}>
        {eyebrow ? <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[--brand-blue]">{eyebrow}</p> : null}
        <h2 className="mb-6 text-3xl leading-tight tracking-tight md:text-4xl lg:text-4xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function LandingCta({ title, description, ctaLabel }: {
  title: string; description: string; ctaLabel: string;
}) {
  return (
    <section className="border-t border-blue-100 bg-blue-50 py-10 md:py-14">
      <div className={cn(container, 'max-w-3xl text-center')}>
        <h2 className="text-3xl leading-tight md:text-4xl lg:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">{description}</p>
        <SmartLink href="#book-an-appointment" aria-label={ctaLabel} className="btn btn-brand-blue mt-6 min-h-12 px-6 py-3">
          {ctaLabel}<ArrowDown className="ml-2 size-4 shrink-0" aria-hidden="true" />
        </SmartLink>
      </div>
    </section>
  );
}

export function LandingReviews({ reviews, title = 'From homeowners who chose SonShine' }: {
  reviews: Review[]; title?: string;
}) {
  if (!reviews.length) return null;
  return (
    <LandingSection eyebrow="Homeowner experiences" title={title} className="bg-slate-50">
      <div className="grid gap-5 md:grid-cols-3">
        {reviews.slice(0, 3).map((review) => (
          <figure key={`${review.author_name}-${review.time ?? review.text}`} className="rounded-2xl border border-slate-200 bg-white p-6">
            <Quote className="mb-3 size-6 text-[--brand-blue]" aria-hidden="true" />
            <blockquote className="whitespace-pre-line text-base leading-relaxed text-slate-700">{review.text}</blockquote>
            <figcaption className="mt-5 text-sm font-semibold text-slate-900">{review.author_name}<span className="block font-normal text-slate-500">Google review</span></figcaption>
          </figure>
        ))}
      </div>
    </LandingSection>
  );
}
