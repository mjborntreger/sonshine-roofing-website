'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Turnstile from '@/components/lead-capture/Turnstile';
import SmartLink from '@/components/utils/SmartLink';
import SmsConsentFields from '@/components/lead-capture/shared/SmsConsentFields';
import {
  buildN8nLeadPayload,
  mapLeadApiFieldErrors,
  type SmsConsentFieldValue,
  validateSmsConsentDraft,
  validateEmail,
  sanitizePhoneInput,
  isUsPhoneComplete,
  formatPhoneExample,
  submitLead,
} from '@/lib/lead-capture/contact-lead';
import { redirectToThankYou } from '@/lib/lead-capture/thank-you';
import { cn } from '@/lib/utils';

const RATING_VALUES = ['1', '2', '3'] as const;
type RatingString = (typeof RATING_VALUES)[number];
const ratingValueLookup: Record<RatingString, 1 | 2 | 3> = {
  '1': 1,
  '2': 2,
  '3': 3,
};
const INPUT_CLASS = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]';
const INPUT_ERROR_CLASS = 'border-red-300 focus:ring-red-200';
const FIELD_ERROR_CLASS = 'mt-1 block text-xs text-red-600';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [smsProjectConsent, setSmsProjectConsent] = useState<SmsConsentFieldValue>('');
  const [smsMarketingConsent, setSmsMarketingConsent] = useState<SmsConsentFieldValue>('');
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  const clearFieldError = (field: string) => {
    if (err) setErr(null);
    if (!fieldErrors[field]) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
    if (status === 'sending') return;

    setErr(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);

    const first = String(fd.get('firstName') || '').trim();
    const last = String(fd.get('lastName') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const message = String(fd.get('message') || '').trim();

    const cfToken = String(fd.get('cfToken') || ''); // provided by <Turnstile />
    const hp_field = String(fd.get('company') || ''); // honeypot

    const nextErrors: Record<string, string> = {};
    if (!first) nextErrors.firstName = 'Enter your first name.';
    if (!last) nextErrors.lastName = 'Enter your last name.';
    if (!validateEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!message) nextErrors.message = 'Enter your feedback message.';

    const phoneDigits = sanitizePhoneInput(phone);
    if (!phoneDigits) {
      nextErrors.phone = 'Enter your phone number.';
    } else if (!isUsPhoneComplete(phoneDigits)) {
      nextErrors.phone = 'Enter a valid US phone number (10 digits).';
    }

    const smsErrors = validateSmsConsentDraft({ smsProjectConsent, smsMarketingConsent });
    Object.assign(nextErrors, smsErrors);

    if (!cfToken) {
      nextErrors.cfToken = 'Verification required.';
    }

    if (Object.keys(nextErrors).length) {
      setStatus('err');
      setErr('Please complete the highlighted fields.');
      setFieldErrors(nextErrors);
      return;
    }

    setStatus('sending');

    const utmSource = qs.get('utm_source');
    const utmMedium = qs.get('utm_medium');
    const utmCampaign = qs.get('utm_campaign');
    const payload = buildN8nLeadPayload({
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
      const serverErrors = mapLeadApiFieldErrors(result.fieldErrors);
      if (Object.keys(serverErrors).length) {
        setFieldErrors(serverErrors);
      }
      return;
    }

    redirectToThankYou(payload);
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
              className={cn(INPUT_CLASS, fieldErrors.firstName && INPUT_ERROR_CLASS)}
              onChange={() => clearFieldError('firstName')}
              aria-invalid={Boolean(fieldErrors.firstName)}
              aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
            />
            {fieldErrors.firstName ? <span id="firstName-error" className={FIELD_ERROR_CLASS}>{fieldErrors.firstName}</span> : null}
          </label>
          <label className="block">
            <span className="text-sm">Last name*</span>
            <input
              name="lastName"
              required
              autoComplete="family-name"
              className={cn(INPUT_CLASS, fieldErrors.lastName && INPUT_ERROR_CLASS)}
              onChange={() => clearFieldError('lastName')}
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
            />
            {fieldErrors.lastName ? <span id="lastName-error" className={FIELD_ERROR_CLASS}>{fieldErrors.lastName}</span> : null}
          </label>
        </div>

        <label className="block">
          <span className="text-sm">Email address*</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={cn(INPUT_CLASS, fieldErrors.email && INPUT_ERROR_CLASS)}
            onChange={() => clearFieldError('email')}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email ? <span id="email-error" className={FIELD_ERROR_CLASS}>{fieldErrors.email}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm">Phone number*</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            aria-describedby="phone-hint"
            className={cn(INPUT_CLASS, fieldErrors.phone && INPUT_ERROR_CLASS)}
            onChange={() => clearFieldError('phone')}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
          {fieldErrors.phone ? <span className={FIELD_ERROR_CLASS}>{fieldErrors.phone}</span> : null}
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
            autoComplete="off"
            className={cn(INPUT_CLASS, fieldErrors.message && INPUT_ERROR_CLASS)}
            onChange={() => clearFieldError('message')}
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={fieldErrors.message ? 'message-error' : undefined}
          />
          {fieldErrors.message ? <span id="message-error" className={FIELD_ERROR_CLASS}>{fieldErrors.message}</span> : null}
        </label>

        {/* Hidden rating (from query param) */}
        <input type="hidden" name="rating" value={rating} readOnly />

        <SmsConsentFields
          smsProjectConsent={smsProjectConsent}
          smsMarketingConsent={smsMarketingConsent}
          onChange={(field, value) => {
            if (field === 'smsProjectConsent') setSmsProjectConsent(value);
            if (field === 'smsMarketingConsent') setSmsMarketingConsent(value);
            clearFieldError(field);
            if (err) setErr(null);
          }}
          errors={{
            smsProjectConsent: fieldErrors.smsProjectConsent,
            smsMarketingConsent: fieldErrors.smsMarketingConsent,
          }}
        />

        {/* Turnstile widget injects cfToken hidden input too */}
        <Turnstile className="pt-1" />
        {fieldErrors.cfToken ? <p className="text-sm font-medium text-red-600">{fieldErrors.cfToken}</p> : null}

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
