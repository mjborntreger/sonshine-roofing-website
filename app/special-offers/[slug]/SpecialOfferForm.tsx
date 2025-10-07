'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Turnstile from '@/components/Turnstile';

type Props = {
  offerCode: string;
  offerSlug: string;
  offerTitle?: string | null;
  offerExpiration?: string | null;
  initialUnlock?: { offerCode: string } | null;
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Submission = 'idle' | 'submitting' | 'success' | 'error';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizePhoneInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatPhoneDisplay(digits: string) {
  const cleaned = sanitizePhoneInput(digits);
  if (!cleaned) return '';
  const useCountry = cleaned.length === 11;
  const country = useCountry ? cleaned[0] : '';
  const local = useCountry ? cleaned.slice(1) : cleaned;
  const area = local.slice(0, 3);
  const mid = local.slice(3, 6);
  const last = local.slice(6, 10);
  if (local.length <= 3) {
    return `${useCountry ? `+${country} ` : ''}(${area}`;
  }
  if (local.length <= 6) {
    return `${useCountry ? `+${country} ` : ''}(${area}) ${mid}`;
  }
  return `${useCountry ? `+${country} ` : ''}(${area}) ${mid}-${last}`;
}

function parseExpirationDate(raw?: string | null): Date {
  if (raw) {
    const parts = raw.split('/').map((part) => Number.parseInt(part, 10));
    if (parts.length === 3) {
      const [month, day, year] = parts;
      if (month && day && year) {
        const candidate = new Date(year, month - 1, day, 23, 59, 59, 999);
        if (!Number.isNaN(candidate.getTime())) {
          return candidate;
        }
      }
    }
  }
  const fallback = new Date();
  fallback.setFullYear(fallback.getFullYear() + 1);
  return fallback;
}

function writeOfferCookie(name: string, code: string, expiration?: string | null) {
  if (typeof document === 'undefined') return;
  const expiresDate = parseExpirationDate(expiration);
  const payload = { code, exp: expiresDate.toISOString() };
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(payload))}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

function readOfferCookie(name: string): { code: string; exp?: string } | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  const rawValue = match.split('=').slice(1).join('=');
  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed.code !== 'string') return null;
    if (parsed.exp) {
      const expDate = new Date(parsed.exp);
      if (Number.isNaN(expDate.getTime()) || expDate.getTime() < Date.now()) {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function SpecialOfferForm({ offerCode, offerSlug, offerTitle, offerExpiration, initialUnlock }: Props) {
  const searchParams = useSearchParams();
  const [values, setValues] = useState<FormValues>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [submission, setSubmission] = useState<Submission>(initialUnlock ? 'success' : 'idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const phoneDigits = useMemo(() => sanitizePhoneInput(values.phone), [values.phone]);

  const resetErrors = () => {
    setFieldErrors({});
    setGlobalError(null);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.firstName.trim()) next.firstName = 'Enter your first name';
    if (!values.lastName.trim()) next.lastName = 'Enter your last name';
    const email = values.email.trim();
    if (!email) {
      next.email = 'Enter your email address';
    } else if (!emailRegex.test(email)) {
      next.email = 'Enter a valid email (example@domain.com)';
    }
    const phone = sanitizePhoneInput(values.phone);
    if (!(phone.length === 10 || phone.length === 11)) {
      next.phone = 'Enter a valid phone number (10 digits, optional country code)';
    }
    return next;
  };

  const handleChange = (key: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [key]: key === 'phone' ? value : value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const clone = { ...prev };
        delete clone[key];
        return clone;
      });
    }
    if (globalError) setGlobalError(null);
  };

  const cookieName = useMemo(() => `ss_offer_${offerSlug}`, [offerSlug]);

  useEffect(() => {
    if (!initialUnlock) return;
    // Ensure any existing cookie is respected client-side
    writeOfferCookie(cookieName, initialUnlock.offerCode, offerExpiration);
  }, [initialUnlock, cookieName, offerExpiration]);

  useEffect(() => {
    if (submission === 'success') return;
    const stored = readOfferCookie(cookieName);
    if (stored && stored.code === offerCode) {
      setSubmission('success');
      setGlobalError(null);
      writeOfferCookie(cookieName, stored.code, offerExpiration);
    }
  }, [submission, cookieName, offerCode, offerExpiration]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(offerCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submission === 'submitting') return;

    resetErrors();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const cfToken = String(formData.get('cfToken') || '');
    const honeypot = String(formData.get('company') || '');

    if (!cfToken) {
      setGlobalError('Please complete the verification.');
      return;
    }

    const payload: Record<string, unknown> = {
      type: 'special-offer',
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: sanitizePhoneInput(values.phone),
      offerCode,
      offerSlug,
      offerTitle: offerTitle ?? undefined,
      cfToken,
      hp_field: honeypot,
      page: `/special-offers/${offerSlug}`,
    };

    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    if (utmSource) payload.utm_source = utmSource.trim();
    if (utmMedium) payload.utm_medium = utmMedium.trim();
    if (utmCampaign) payload.utm_campaign = utmCampaign.trim();

    setSubmission('submitting');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({} as any));
      if (res.ok && json?.ok) {
        setSubmission('success');
        writeOfferCookie(cookieName, offerCode, offerExpiration);
        try {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({
            event: 'special_offer_claimed',
            offer_slug: offerSlug,
            offer_code: offerCode,
          });
        } catch {}
        return;
      }
      setSubmission('error');
      setGlobalError(json?.error || 'We could not send your request. Please try again.');
    } catch (err) {
      setSubmission('error');
      setGlobalError('Network error. Please try again.');
    }
  };

  if (submission === 'success') {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white/95 p-6 shadow-lg print:border-neutral-700 print:bg-white">
        <h2 className="text-2xl font-semibold text-emerald-700">You're all set!</h2>
        <p className="mt-2 text-sm text-slate-600 print:text-black">
          Thanks! Your offer code is below. We’ve also emailed it to you so you can keep it handy.
        </p>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50 p-6 text-center text-slate-900 print:border-solid print:border-black print:bg-white">
          <p className="text-sm uppercase tracking-widest text-emerald-600">Your Offer Code</p>
          <p className="mt-2 text-4xl font-bold tracking-[0.2em] text-emerald-700 print:text-black">
            {offerCode}
          </p>
        </div>

        <p className="mt-6 text-sm text-slate-600 print:text-black">
          Prefer to call? Just mention <span className="font-semibold">{offerCode}</span> and we’ll apply your discount instantly.
          {' '}
          <a href="tel:+19418664320" className="text-brand-blue underline print:no-underline">
            Call (941) 866-4320
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl mb-12 border border-blue-100 bg-white/95 p-6 shadow-lg print:hidden">
      <h2 
        className="text-2xl font-semibold text-slate-800"
        >
          Claim this offer
      </h2>
      <p className="mt-4 text-sm text-slate-600">
        Fill out the quick form below and we’ll email your offer code instantly.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="firstName">
            First name*
            <input
              id="firstName"
              name="firstName"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/40"
              value={values.firstName}
              onChange={handleChange('firstName')}
              autoComplete="given-name"
              aria-invalid={Boolean(fieldErrors.firstName)}
              aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
            />
            {fieldErrors.firstName && (
              <span id="firstName-error" className="mt-1 block text-xs text-red-600">
                {fieldErrors.firstName}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="lastName">
            Last name*
            <input
              id="lastName"
              name="lastName"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/40"
              value={values.lastName}
              onChange={handleChange('lastName')}
              autoComplete="family-name"
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
            />
            {fieldErrors.lastName && (
              <span id="lastName-error" className="mt-1 block text-xs text-red-600">
                {fieldErrors.lastName}
              </span>
            )}
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email*
          <input
            id="email"
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/40"
            value={values.email}
            onChange={handleChange('email')}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && (
            <span id="email-error" className="mt-1 block text-xs text-red-600">
              {fieldErrors.email}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700" htmlFor="phone">
          Phone*
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/40"
            value={values.phone}
            onChange={handleChange('phone')}
            autoComplete="tel"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
          />
          {fieldErrors.phone && (
            <span id="phone-error" className="mt-1 block text-xs text-red-600">
              {fieldErrors.phone}
            </span>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Digits only please. Example: {formatPhoneDisplay(phoneDigits || '9415551234')}
          </p>
        </label>

        <div className="pt-2">
          <Turnstile className="pt-1" />
        </div>

        {globalError && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
            {globalError}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-brand-orange btn-md w-full"
          disabled={submission === 'submitting'}
        >
          {submission === 'submitting' ? 'Sending…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
