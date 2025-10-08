'use client';

import { ArrowRight, CheckCircle2, Clock4, ExternalLink, ShieldCheck, Star } from 'lucide-react';
import { useMemo } from 'react';
import SmartLink from '@/components/SmartLink';
import { Button } from '@/components/ui/button';
import type { SuccessMeta } from '@/lib/contact-lead';
import { getSuccessLinks } from '@/components/lead-form/config';
import { cn } from '@/lib/utils';

type LeadFormSuccessProps = {
  successMeta: SuccessMeta;
  onReset: () => void;
  maxWidthClassName?: string;
};

const INFO_BADGE_CLASS = 'inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1';
const SUCCESS_LINK_CARD_CLASS =
  'group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[--brand-blue] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]';
const SUCCESS_LINK_ICON_WRAPPER_CLASS =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--brand-blue]/10 text-[--brand-blue]';

export default function LeadFormSuccess({ successMeta, onReset, maxWidthClassName = 'max-w-3xl' }: LeadFormSuccessProps) {
  const successLinks = useMemo(() => getSuccessLinks(successMeta.projectType), [successMeta.projectType]);

  return (
    <div className="mt-8 flex justify-center px-4">
      <div
        className={cn(
          'w-full mx-auto rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-md',
          maxWidthClassName
        )}
      >
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
          <h3 className="mt-4 text-3xl font-semibold text-slate-900">We’ve got it — thank you!</h3>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Your message is already on the way to our project support team. We’ll reach out shortly with next steps. If a
            storm is moving in or water is coming inside, call us right now at{' '}
            <a className="font-semibold text-[--brand-blue]" href="tel:+19418664320">
              (941) 866-4320
            </a>
            .
          </p>
          {(successMeta.helpTopicLabels.length || successMeta.timelineLabel) && (
            <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">What you shared</h4>
              {successMeta.timelineLabel && (
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Timeline:</span> {successMeta.timelineLabel}
                </p>
              )}
              {successMeta.helpTopicLabels.length ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-slate-700">Your priorities:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {successMeta.helpTopicLabels.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className={INFO_BADGE_CLASS}>
              <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" /> Licensed &amp; insured
            </span>
            <span className={INFO_BADGE_CLASS}>
              <Clock4 className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" /> Typical response under 30 minutes
            </span>
            <span className={INFO_BADGE_CLASS}>
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" /> 4.8 rating on Google
            </span>
          </div>
        </div>
        {successLinks.length > 0 && (
          <div className="not-prose mt-10">
            <h4 className="text-lg font-semibold text-slate-900">What to do next</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {successLinks.map(({ label, description, href, external, icon: Icon }) => (
                <SmartLink
                  key={`${label}-${href}`}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className={SUCCESS_LINK_CARD_CLASS}
                >
                  <div className="flex gap-3">
                    <span className={SUCCESS_LINK_ICON_WRAPPER_CLASS}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                      <p className="mt-1 text-xs text-slate-500">{description}</p>
                    </div>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[--brand-blue]">
                    {external ? 'Open link' : 'Continue'}
                    {external ? (
                      <ExternalLink
                        className="h-4 w-4 text-[--brand-blue] transition group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-[--brand-blue] transition group-hover:translate-x-0.5" aria-hidden="true" />
                    )}
                  </span>
                </SmartLink>
              ))}
            </div>
          </div>
        )}
        <div className="mt-10 flex justify-center">
          <Button type="button" variant="brandBlue" onClick={onReset}>
            Start a new request
          </Button>
        </div>
      </div>
    </div>
  );
}
