'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Phone, ShieldCheck } from 'lucide-react';
import SmartLink from '@/components/utils/SmartLink';
import {
  fireAdsLeadSubmitOnce,
  readThankYouContext,
  type AdsLeadDataLayerEvent,
  type ThankYouLeadContext,
} from '@/lib/lead-capture/thank-you';

function getLeadId(searchParams: URLSearchParams | null): string | null {
  return searchParams?.get('sri_lead_id') || searchParams?.get('lead_id') || null;
}

function getHeading(context: ThankYouLeadContext | null): string {
  switch (context?.formType) {
    case 'referral':
      return 'Referral received';
    case 'feedback':
      return 'Thanks for telling us';
    case 'financing-calculator':
      return 'Your financing request is in';
    case 'special-offer':
      return 'Your offer request is in';
    default:
      return 'Thank you';
  }
}

function getMessage(context: ThankYouLeadContext | null): string {
  switch (context?.formType) {
    case 'referral':
      return 'We received your referral and will follow up about the roof replacement project.';
    case 'feedback':
      return 'We read every note and will reach out if we need more details.';
    case 'financing-calculator':
      return 'We received your financing information. You can return to the calculator while our team reviews your request.';
    case 'special-offer':
      return 'We received your offer request and will follow up with the details.';
    default:
      return 'We received your request. Our team will follow up shortly.';
  }
}

export default function ThankYouClient() {
  const searchParams = useSearchParams();
  const leadId = getLeadId(searchParams);
  const context = useMemo(() => readThankYouContext(leadId), [leadId]);
  const [debugEvent, setDebugEvent] = useState<AdsLeadDataLayerEvent | null>(null);

  useEffect(() => {
    if (!context) return;
    const event = fireAdsLeadSubmitOnce(context);
    if (process.env.NODE_ENV !== 'production') {
      setDebugEvent(event);
    }
  }, [context]);

  return (
    <section className="container-edge mx-auto max-w-3xl py-16">
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">{getHeading(context)}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{getMessage(context)}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <SmartLink href="/contact-us" className="btn btn-brand-blue btn-md justify-center">
            Contact our office
          </SmartLink>
          <SmartLink href="tel:+19418664320" className="btn btn-brand-orange btn-md justify-center">
            <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
            Call (941) 866-4320
          </SmartLink>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[--brand-blue]" aria-hidden="true" />
          <span>Licensed and insured since 1987. We typically respond quickly during business hours.</span>
        </div>

        {process.env.NODE_ENV !== 'production' && debugEvent ? (
          <pre className="mt-6 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(debugEvent, null, 2)}
          </pre>
        ) : null}
      </div>
    </section>
  );
}
