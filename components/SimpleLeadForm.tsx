'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock4,
  Droplets,
  Hammer,
  HandCoins,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  ExternalLink,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Turnstile from '@/components/Turnstile';
import SmartLink from '@/components/SmartLink';
import { Button } from '@/components/ui/button';
import { writeCookie, deleteCookie } from '@/lib/client-cookies';
import {
  CONTACT_READY_COOKIE,
  CONTACT_READY_MAX_AGE,
  LEAD_SUCCESS_COOKIE,
  LeadSuccessCookiePayload,
  SuccessMeta,
  parseLeadSuccessCookie,
  persistLeadSuccessCookie,
  sanitizePhoneInput,
  validateEmail,
} from '@/lib/contact-lead';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type JourneyKey = 'repair' | 'retail' | 'maintenance' | 'something-else';

type ProjectOption = {
  value: JourneyKey;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

type TimelineOption = {
  value: string;
  label: string;
};

type ResourceLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

type FormState = {
  projectType: JourneyKey | '';
  timeline: string;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  consentSms: boolean;
};

const PROJECT_OPTIONS: ProjectOption[] = [
  {
    value: 'repair',
    label: 'Emergency leak help',
    description: 'Water coming in or ceiling damage right now',
    icon: Droplets,
    accent: 'border-rose-200 bg-rose-50 text-rose-600',
  },
  {
    value: 'retail',
    label: 'Plan a roof replacement',
    description: 'Ready to compare options for a new roofing system',
    icon: Hammer,
    accent: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  {
    value: 'maintenance',
    label: 'Light repairs, inspections, maintenance',
    description: 'Annual checkups, prepare for hurricane season, real estate',
    icon: Wrench,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  },
  {
    value: 'something-else',
    label: 'Something else',
    description: 'Warranty, insurance, skylights, or just have a few questions',
    icon: MessageCircle,
    accent: 'border-violet-200 bg-violet-50 text-violet-600',
  },
];

const STANDARD_TIMELINE_OPTIONS: TimelineOption[] = [
  { value: 'within-72-hours', label: 'Within 72 hours' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'next-2-3-months', label: 'In the next 2–3 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'not-sure-yet', label: 'Not sure yet' },
];

const JOURNEY_RESOURCES: Partial<Record<JourneyKey, ResourceLink[]>> = {
  repair: [
    {
      label: 'Learn about roof repair',
      description: 'Costs, common issues, repair vs. replace',
      href: '/roof-repair',
      icon: Wrench,
    },
  ],
  retail: [
    {
      label: 'Learn about roof replacement',
      description: 'Warranties, materials, what to expect',
      href: '/roof-replacement-sarasota-fl',
      icon: Hammer,
    },
    {
      label: 'Get a 60-second estimate',
      description: 'Satellite measurements, select materials',
      href: 'https://www.myquickroofquote.com/contractors/sonshine-roofing',
      icon: ClipboardList,
      external: true,
    },
  ],
  maintenance: [
    {
      label: 'Learn about roof inspection',
      description: 'Tip Top Roof Check-up',
      href: '/roof-inspection',
      icon: ClipboardList,
    },
    {
      label: 'Learn about roof maintenance',
      description: 'Roof Care Club',
      href: '/roof-maintenance',
      icon: Sparkles,
    },
  ],
  'something-else': [],
};

const UNIVERSAL_RESOURCES: ResourceLink[] = [
  {
    label: 'Explore financing options',
    description: 'Payment deferrals, low APR, fast approval',
    href: '/financing',
    icon: HandCoins,
  },
  {
    label: 'See our past work',
    description: 'Browse our project gallery, learn more about your aesthetic options',
    href: '/project',
    icon: Star,
  },
];

const INPUT_BASE_CLASS =
  'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30';
const INPUT_DEFAULT_CLASS = 'border-slate-200';
const INPUT_ERROR_CLASS = 'border-red-300 focus:border-red-400 focus:ring-red-200';
const TEXTAREA_CLASS =
  'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30';

const SELECTION_PILL_BASE_CLASS =
  'rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const SELECTION_PILL_SELECTED_CLASS = 'border-[--brand-blue] bg-[--brand-blue] text-white shadow';
const SELECTION_PILL_UNSELECTED_CLASS = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';

const INFO_BADGE_CLASS = 'inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1';
const SUCCESS_LINK_CARD_CLASS =
  'group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[--brand-blue] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]';
const SUCCESS_LINK_ICON_WRAPPER_CLASS =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--brand-blue]/10 text-[--brand-blue]';

const INITIAL_STATE: FormState = {
  projectType: '',
  timeline: '',
  notes: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: 'FL',
  zip: '',
  consentSms: false,
};

function getSuccessLinks(projectType: string): ResourceLink[] {
  const specific = (JOURNEY_RESOURCES as Record<string, ResourceLink[] | undefined>)[projectType] ?? [];
  return [...specific, ...UNIVERSAL_RESOURCES];
}

function getTimelineLabel(value: string): string | null {
  if (!value) return null;
  const option = STANDARD_TIMELINE_OPTIONS.find((item) => item.value === value);
  return option ? option.label : value;
}

function buildSuccessMetaFromPayload(payload: LeadSuccessCookiePayload): SuccessMeta {
  const helpTopicLabels = Array.isArray(payload.helpTopicLabels)
    ? payload.helpTopicLabels.filter((item): item is string => typeof item === 'string')
    : [];
  const timelineLabel = typeof payload.timelineLabel === 'string' && payload.timelineLabel
    ? payload.timelineLabel
    : getTimelineLabel(payload.timeline || '') || null;

  return {
    projectType: payload.projectType,
    helpTopicLabels,
    timelineLabel,
  };
}

export default function SimpleLeadForm({ initialSuccessCookie }: { initialSuccessCookie?: string | null }) {
  const searchParams = useSearchParams();
  const parsedCookie = useMemo(() => parseLeadSuccessCookie(initialSuccessCookie), [initialSuccessCookie]);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(parsedCookie ? 'success' : 'idle');
  const [successMeta, setSuccessMeta] = useState<SuccessMeta | null>(
    parsedCookie ? buildSuccessMetaFromPayload(parsedCookie) : null
  );

  const utm = useMemo(() => {
    const source = searchParams?.get('utm_source') || undefined;
    const medium = searchParams?.get('utm_medium') || undefined;
    const campaign = searchParams?.get('utm_campaign') || undefined;
    return { source, medium, campaign };
  }, [searchParams]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const validation: Record<string, string> = {};
    if (!form.projectType) validation.projectType = 'Pick the option that fits best.';
    if (!form.timeline) validation.timeline = 'Choose when you’d like help.';
    if (!form.firstName.trim()) validation.firstName = 'Enter your first name.';
    if (!form.lastName.trim()) validation.lastName = 'Enter your last name.';
    if (!validateEmail(form.email)) validation.email = 'Enter a valid email (example@domain.com).';

    const phoneDigits = sanitizePhoneInput(form.phone);
    if (!(phoneDigits.length === 10 || phoneDigits.length === 11)) {
      validation.phone = 'Enter a 10-digit phone number (add country code if needed).';
    }

    if (!form.address1.trim()) validation.address1 = 'Enter your street address.';
    if (!form.city.trim()) validation.city = 'City is required.';

    const stateValue = form.state.trim().toUpperCase();
    if (stateValue.length !== 2) validation.state = 'Use the two-letter state code.';

    const zipDigits = sanitizePhoneInput(form.zip);
    if (zipDigits.length !== 5) validation.zip = 'ZIP should be 5 digits.';

    if (Object.keys(validation).length) {
      setErrors(validation);
      setGlobalError('Double-check the highlighted fields.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const cfToken = String(formData.get('cfToken') || '');
    const honeypot = String(formData.get('company') || '');

    if (!cfToken) {
      setErrors((prev) => ({ ...prev, cfToken: 'Verification required.' }));
      setGlobalError('Please complete the verification to continue.');
      return;
    }

    setStatus('submitting');
    setGlobalError(null);

    const timelineLabel = getTimelineLabel(form.timeline) || form.timeline;
    const notes = form.notes.trim();

    const payload: Record<string, unknown> = {
      type: 'contact-lead',
      projectType: form.projectType,
      timeline: timelineLabel || undefined,
      notes: notes || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: phoneDigits,
      address1: form.address1.trim(),
      address2: form.address2.trim() || undefined,
      city: form.city.trim(),
      state: stateValue,
      zip: form.zip.trim(),
      preferredContact: 'phone',
      bestTime: 'no-preference',
      consentSms: form.consentSms,
      cfToken,
      hp_field: honeypot,
      page: '/contact-us',
      submittedAt: new Date().toISOString(),
    };

    if (utm.source) payload.utm_source = utm.source;
    if (utm.medium) payload.utm_medium = utm.medium;
    if (utm.campaign) payload.utm_campaign = utm.campaign;

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Unable to send your request.');
      }

      writeCookie(CONTACT_READY_COOKIE, '1', CONTACT_READY_MAX_AGE);

      const successPayload: LeadSuccessCookiePayload = {
        projectType: form.projectType,
        helpTopics: [],
        helpTopicLabels: [],
        timeline: form.timeline,
        timelineLabel: timelineLabel || undefined,
        timestamp: new Date().toISOString(),
      };
      persistLeadSuccessCookie(successPayload);
      setSuccessMeta(buildSuccessMetaFromPayload(successPayload));

      try {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: 'lead_form_submitted',
          projectType: form.projectType,
          helpTopics: '',
        });
      } catch {
        // ignore GTM errors
      }

      setForm(INITIAL_STATE);
      setErrors({});
      setStatus('success');
    } catch (error: any) {
      console.error('Lead submission failed', error);
      setStatus('error');
      setGlobalError(error?.message || 'We could not send your message. Please call us at (941) 866-4320.');
    }
  };

  const handleResetSuccess = () => {
    deleteCookie(LEAD_SUCCESS_COOKIE);
    setSuccessMeta(null);
    setStatus('idle');
    setGlobalError(null);
    setForm(INITIAL_STATE);
  };

  if (status === 'success' && successMeta) {
    const successLinks = getSuccessLinks(successMeta.projectType);
    return (
      <div className="mt-8 flex justify-center px-4">
        <div className="w-full max-w-3xl rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-md">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
            <h3 className="mt-4 text-3xl font-semibold text-slate-900">We’ve got it — thank you!</h3>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              Your message is already on the way to our project support team. We’ll reach out shortly with next steps.
              If a storm is moving in or water is coming inside, call us right now at{' '}
              <a className="font-semibold text-[--brand-blue]" href="tel:+19418664320">(941) 866-4320</a>.
            </p>
            {successMeta.timelineLabel && (
              <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">What you shared</h4>
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Timeline:</span> {successMeta.timelineLabel}
                </p>
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
            <div className="mt-10">
              <h4 className="text-lg font-semibold text-slate-900">What to do next</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {successLinks.map(({ label, description, href, external, icon: Icon }) => (
                  <a
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
                        <ExternalLink className="h-4 w-4 text-[--brand-blue] transition group-hover:translate-x-0.5" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-[--brand-blue] transition group-hover:translate-x-0.5" aria-hidden="true" />
                      )}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="mt-10 flex justify-center">
            <Button type="button" variant="brandBlue" onClick={handleResetSuccess}>
              Start a new request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="mt-8" onSubmit={handleSubmit} noValidate>
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-blue-100 bg-white shadow-md">
        <div className="border-b rounded-t-3xl border-blue-100 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-6">
          <h2 className="top-24 flex items-center gap-2" id="book-an-appointment">
            <CalendarDays className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
            <span>Contact Our Office</span>
          </h2>
          <p className="text-slate-700 text-sm pb-2">
            We respond within 30 minutes during business hours
          </p>
        </div>

        <div className="p-6">
          {globalError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          <div className="grid gap-6">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What do you need?</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {PROJECT_OPTIONS.map(({ value, label, description, icon: Icon, accent }) => {
                  const selected = form.projectType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField('projectType', value)}
                      className={cn(
                        'group flex h-full flex-col justify-between rounded-3xl border bg-white px-4 py-5 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        selected
                          ? 'border-[--brand-blue] shadow-[0_10px_25px_rgba(15,76,129,0.12)]'
                          : 'border-slate-200 hover:-translate-y-0.5 hover:shadow-lg'
                      )}
                      aria-pressed={selected}
                    >
                      <div>
                        <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', accent)}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {selected ? 'Selected' : 'Tap to select'}
                        </div>
                        <h4 className="mt-4 text-md md:text-xl font-semibold text-slate-900">{label}</h4>
                        <div className="mt-1 text-xs text-slate-500">{description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.projectType && <p className="mt-2 text-sm font-medium text-red-600">{errors.projectType}</p>}
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">When would you like help?</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {STANDARD_TIMELINE_OPTIONS.map(({ value, label }) => {
                  const selected = form.timeline === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField('timeline', value)}
                      className={cn(
                        SELECTION_PILL_BASE_CLASS,
                        selected ? SELECTION_PILL_SELECTED_CLASS : SELECTION_PILL_UNSELECTED_CLASS
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {errors.timeline && <p className="mt-2 text-sm font-medium text-red-600">{errors.timeline}</p>}
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How can we reach you?</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  First name
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(event) => setField('firstName', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.firstName && INPUT_ERROR_CLASS)}
                  />
                  {errors.firstName && <span className="mt-1 text-xs text-red-600">{errors.firstName}</span>}
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Last name
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(event) => setField('lastName', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.lastName && INPUT_ERROR_CLASS)}
                  />
                  {errors.lastName && <span className="mt-1 text-xs text-red-600">{errors.lastName}</span>}
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => setField('phone', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.phone && INPUT_ERROR_CLASS)}
                  />
                  {errors.phone && <span className="mt-1 text-xs text-red-600">{errors.phone}</span>}
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.email && INPUT_ERROR_CLASS)}
                  />
                  {errors.email && <span className="mt-1 text-xs text-red-600">{errors.email}</span>}
                </label>
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Where is the project?</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2 block text-sm font-medium text-slate-700">
                  Street address
                  <input
                    type="text"
                    name="address1"
                    autoComplete="street-address"
                    value={form.address1}
                    onChange={(event) => setField('address1', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.address1 && INPUT_ERROR_CLASS)}
                  />
                  {errors.address1 && <span className="mt-1 text-xs text-red-600">{errors.address1}</span>}
                </label>
                <label className="md:col-span-2 block text-sm font-medium text-slate-700">
                  Apt, suite, etc. (optional)
                  <input
                    type="text"
                    name="address2"
                    autoComplete="address-line2"
                    value={form.address2}
                    onChange={(event) => setField('address2', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS)}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  City
                  <input
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(event) => setField('city', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.city && INPUT_ERROR_CLASS)}
                  />
                  {errors.city && <span className="mt-1 text-xs text-red-600">{errors.city}</span>}
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  State
                  <input
                    type="text"
                    name="state"
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={(event) => setField('state', event.target.value.toUpperCase())}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.state && INPUT_ERROR_CLASS)}
                    maxLength={2}
                  />
                  {errors.state && <span className="mt-1 text-xs text-red-600">{errors.state}</span>}
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  ZIP
                  <input
                    type="text"
                    name="zip"
                    autoComplete="postal-code"
                    value={form.zip}
                    onChange={(event) => setField('zip', event.target.value)}
                    className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS, errors.zip && INPUT_ERROR_CLASS)}
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {errors.zip && <span className="mt-1 text-xs text-red-600">{errors.zip}</span>}
                </label>
              </div>
            </section>

            <section>
              <label className="block text-sm font-medium text-slate-700">
                Anything else you’d like us to know?
                <textarea
                  name="notes"
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                  className={cn(TEXTAREA_CLASS)}
                />
              </label>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="consentSms"
                  checked={form.consentSms}
                  onChange={(event) => setField('consentSms', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[--brand-blue] focus:ring-[--brand-blue]"
                />
                <span>
                  By submitting this form, you agree to receive transactional and promotional communications from
                  Sonshine Roofing. Message frequency may vary. Message and data rates may apply. Reply STOP to opt out at any time.
                </span>
              </label>
              <p className="mt-2 text-xs text-right text-slate-500">
                For more information,{' '}
                <SmartLink href="/privacy-policy" data-icon-affordance="up-right" className="font-semibold text-[--brand-blue]">
                  view our privacy policy
                  <ArrowUpRight className="icon-affordance h-3 w-3 ml-1 inline" />
                </SmartLink>
              </p>
            </section>

            <section>
              <Turnstile className="pt-1" action="contact-lead" />
              {errors.cfToken && <p className="mt-2 text-sm font-medium text-red-600">{errors.cfToken}</p>}
            </section>

            <div className="flex justify-end">
              <Button type="submit" variant="brandOrange" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending…' : 'Submit request'}
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
