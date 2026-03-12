'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Turnstile from '@/components/lead-capture/Turnstile';
import SmartLink from '@/components/utils/SmartLink';
import SmsConsentFields from '@/components/lead-capture/shared/SmsConsentFields';
import {
  buildZapierLeadPayload,
  type SmsConsentFieldValue,
  validateSmsConsentDraft,
  sanitizePhoneInput,
  isUsPhoneComplete,
  formatPhoneExample,
  submitLead,
} from '@/lib/lead-capture/contact-lead';

const RATING_VALUES = ['1', '2', '3'] as const;
type RatingString = (typeof RATING_VALUES)[number];
const ratingValueLookup: Record<RatingString, 1 | 2 | 3> = {
  '1': 1,
  '2': 2,
  '3': 3,
};

function toRatingString(input: string | null): RatingString {
  if (input && RATING_VALUES.includes(input as RatingString)) {
    return input as RatingString;
  }
  return '3';
}

export default function TellUsWhyForm() {
  const qs = useSearchParams();
  const rating = toRatingString(qs?.get('rating') ?? null);
  const ratingValue = ratingValueLookup[rating];

  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [consentErrors, setConsentErrors] = useState<Record<string, string>>({});
  const [smsProjectConsent, setSmsProjectConsent] = useState<SmsConsentFieldValue>('');
  const [smsMarketingConsent, setSmsMarketingConsent] = useState<SmsConsentFieldValue>('');
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  useEffect(() => {
    if (status !== 'ok') return;

    setCountdown(3);
    const tick = setInterval(() => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => {
      clearInterval(tick);
      clearTimeout(redirectTimer);
    };
  }, [status, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErr(null);

    const fd = new FormData(e.currentTarget);

    const first = String(fd.get('firstName') || '').trim();
    const last = String(fd.get('lastName') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const message = String(fd.get('message') || '').trim();

    const cfToken = String(fd.get('cfToken') || ''); // provided by <Turnstile />
    const hp_field = String(fd.get('company') || ''); // honeypot

    const smsErrors = validateSmsConsentDraft({ smsProjectConsent, smsMarketingConsent });
    if (Object.keys(smsErrors).length) {
      setStatus('err');
      setErr('Please complete the SMS consent selections.');
      setConsentErrors(smsErrors);
      return;
    }
    setConsentErrors({});

    const phoneDigits = sanitizePhoneInput(phone);
    if (phoneDigits && !isUsPhoneComplete(phoneDigits)) {
      setStatus('err');
      setErr('Enter a valid US phone number (10 digits).');
      return;
    }

    const utmSource = qs.get('utm_source');
    const utmMedium = qs.get('utm_medium');
    const utmCampaign = qs.get('utm_campaign');
    const payload = buildZapierLeadPayload({
      formType: 'feedback',
      submittedAt: new Date().toISOString(),
      source: {
        page: '/tell-us-why',
        utm_source: utmSource?.trim() || undefined,
        utm_medium: utmMedium?.trim() || undefined,
        utm_campaign: utmCampaign?.trim() || undefined,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        tz: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
      },
      contact: {
        firstName: first,
        lastName: last,
        email,
        phone,
      },
      smsConsent: {
        smsProjectConsent,
        smsMarketingConsent,
      },
      details: {
        rating: ratingValue,
        message,
      },
      antiSpam: {
        cfToken,
        hp_field: hp_field || undefined,
      },
    });

    const result = await submitLead(payload, {
      gtmEvent: {
        event: 'feedback_submitted',
        rating: ratingValue,
        page: '/tell-us-why',
      },
      metaPixelEvents: 'Contact',
      contactReadyCookie: false,
    });

    if (!result.ok) {
      setStatus('err');
      setErr(result.error || 'Something went wrong. Please try again.');
      return;
    }

    setStatus('ok');
  }

  if (status === 'ok') {
    return (
      <main className="container-edge mx-auto max-w-2xl py-10">
        <h2 className="text-3xl font-semibold">Thanks for telling us.</h2>
        <p className="mt-2 text-slate-700">
          We read every note and will reach out if we need more details. Since 1987 we’ve got you covered.
        </p>
        <p className="mt-4 text-slate-700">Redirecting in {countdown}…</p>
        <SmartLink href="/" className="mt-2 inline-block text-[--brand-blue]">
          If you are not redirected automatically, click here.
        </SmartLink>
      </main>
    );
  }

  return (
    <main className="container-edge mx-auto max-w-2xl py-10">
      <h1 className="text-3xl font-semibold">Tell us what went wrong</h1>
      <p className="mt-2 text-slate-700">Your honest feedback helps us fix issues fast and do right by you.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        {/* Honeypot field (hidden from humans) */}
        <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm">First name*</span>
            <input
              name="firstName"
              required
              autoComplete="given-name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
            />
          </label>
          <label className="block">
            <span className="text-sm">Last name*</span>
            <input
              name="lastName"
              required
              autoComplete="family-name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm">Email address*</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
          />
        </label>

        <label className="block">
          <span className="text-sm">Phone number</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            aria-describedby="phone-hint"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
          />
          <p id="phone-hint" className="mt-1 text-xs text-slate-500">
            Digits only, US numbers. Example: {formatPhoneExample()}
          </p>
        </label>

        <label className="block">
          <span className="text-sm">Message*</span>
          <textarea
            name="message"
            rows={6}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
          />
        </label>

        {/* Hidden rating (from query param) */}
        <input type="hidden" name="rating" value={rating} readOnly />

        <SmsConsentFields
          smsProjectConsent={smsProjectConsent}
          smsMarketingConsent={smsMarketingConsent}
          onChange={(field, value) => {
            if (field === 'smsProjectConsent') setSmsProjectConsent(value);
            if (field === 'smsMarketingConsent') setSmsMarketingConsent(value);
            if (consentErrors[field]) {
              setConsentErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
              });
            }
            if (err) setErr(null);
          }}
          errors={{
            smsProjectConsent: consentErrors.smsProjectConsent,
            smsMarketingConsent: consentErrors.smsMarketingConsent,
          }}
        />

        {/* Turnstile widget injects cfToken hidden input too */}
        <Turnstile className="pt-1" />

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={status === 'sending'} className="btn btn-brand-orange btn-md">
            {status === 'sending' ? 'Sending…' : 'Send feedback'}
          </button>
          {status === 'err' && <p className="text-sm text-red-600">{err}</p>}
        </div>
      </form>
    </main>
  );
}
