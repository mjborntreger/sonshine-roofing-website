'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import SmartLink from '@/components/utils/SmartLink';
import { Button } from '@/components/ui/button';
import { deleteCookie } from '@/lib/telemetry/client-cookies';
import {
  DEFAULT_PREFERRED_CONTACT,
  LEAD_SUCCESS_COOKIE,
  LeadSuccessCookiePayload,
  SuccessMeta,
  buildContactLeadPayload,
  formatPhoneExample,
  normalizeState,
  normalizeZip,
  persistLeadSuccessCookie,
  sanitizePhoneInput,
  submitLead,
  type ContactLeadInput,
  validateContactAddressDraft,
  validateContactIdentityDraft,
} from '@/lib/lead-capture/contact-lead';
import { cn } from '@/lib/utils';
import { STANDARD_TIMELINE_OPTIONS, type JourneyKey, getTimelineLabelForDisplay } from '@/components/lead-capture/lead-form/config';
import { useUtmParams } from '@/components/lead-capture/useUtmParams';
import { renderHighlight } from '@/components/utils/renderHighlight';

// STYLES
const INPUT_BASE_CLASS =
  'mt-2 w-full rounded-xl border border-blue-100 px-4 py-2 shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30';
const INPUT_ERROR_CLASS = 'border-red-300 focus:border-red-400 focus:ring-red-200';
const SECTION_TITLE_BASE_CLASS = 'text-xl sm:text-2xl font-semibold tracking-wide text-slate-700';
const SECTION_EYELASH = 'text-sm my-1 text-slate-500';

const Turnstile = dynamic(() => import('@/components/lead-capture/Turnstile'), { ssr: false });
const LeadFormSuccess = dynamic(() => import('@/components/lead-capture/lead-form/LeadFormSuccess'), {
  ssr: false,
  loading: () => null,
});

type Status = 'idle' | 'submitting' | 'success' | 'error';

type FormState = {
  projectType: JourneyKey;
  timeline: string;
  notes: string;
  roofType: RoofTypeValue | '';
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

type RoofTypeValue = 'shingle' | 'metal' | 'tile' | 'flat';

type RoofTypeOption = {
  value: RoofTypeValue;
  label: string;
  imageSrc: string;
  imageAlt: string;
};

const ROOF_TYPE_OPTIONS: RoofTypeOption[] = [
  {
    value: 'shingle',
    label: 'Shingle',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Shingle-Roof.webp',
    imageAlt: 'Close-up of a shingle roof',
  },
  {
    value: 'metal',
    label: 'Metal',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Metal-Roof.webp',
    imageAlt: 'Modern home with metal roofing panels',
  },
  {
    value: 'tile',
    label: 'Tile',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Tile-Roof.webp',
    imageAlt: 'Clay tile roof on a Florida home',
  },
  {
    value: 'flat',
    label: 'Flat',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Flat-Roof.webp',
    imageAlt: 'Flat commercial roof with HVAC equipment',
  },
];

function buildInitialState(projectType: JourneyKey): FormState {
  return {
    projectType,
    timeline: '',
    notes: '',
    roofType: '',
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
}

function getRoofTypeLabel(value: RoofTypeValue | ''): string | null {
  if (!value) return null;
  const option = ROOF_TYPE_OPTIONS.find((item) => item.value === value);
  return option?.label ?? null;
}

function buildSuccessMetaFromPayload(payload: LeadSuccessCookiePayload): SuccessMeta {
  const helpTopicLabels = Array.isArray(payload.helpTopicLabels)
    ? payload.helpTopicLabels.filter((item): item is string => typeof item === 'string')
    : [];
  const timelineLabel =
    typeof payload.timelineLabel === 'string' && payload.timelineLabel
      ? payload.timelineLabel
      : getTimelineLabelForDisplay(payload.projectType, payload.timeline || '') || null;
  const notes = typeof payload.notes === 'string' ? payload.notes : null;
  const roofTypeLabel =
    typeof payload.roofTypeLabel === 'string' && payload.roofTypeLabel
      ? payload.roofTypeLabel
      : null;

  return {
    projectType: payload.projectType,
    helpTopicLabels,
    timelineLabel,
    notes,
    roofTypeLabel,
  };
}

type Props = {
  projectType: JourneyKey;
  page?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
};

const DEFAULT_TITLE = 'Contact Our Office';
const DEFAULT_TITLE_HIGHLIGHT = 'Our Office';
const DEFAULT_DESCRIPTION =
  "We respond within 30 minutes during business hours. After hours, we'll contact you in the next business day.";

export default function EvenSimplerLeadForm({
  projectType = 'retail',
  page,
  title,
  titleHighlight,
  description,
}: Props) {
  const initialProjectType = projectType || 'retail';
  const [form, setForm] = useState<FormState>(() => buildInitialState(initialProjectType));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [successMeta, setSuccessMeta] = useState<SuccessMeta | null>(null);

  const utmParams = useUtmParams();

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
    const identityErrors = validateContactIdentityDraft({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
    });
    const addressErrors = validateContactAddressDraft({
      address1: form.address1,
      address2: form.address2,
      city: form.city,
      state: form.state,
      zip: form.zip,
    });

    Object.assign(validation, identityErrors, addressErrors);

    if (Object.keys(validation).length) {
      setErrors(validation);
      setGlobalError('Please double-check your contact details (highlighted fields).');
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

    const timelineLabel = getTimelineLabelForDisplay(form.projectType, form.timeline) || form.timeline;
    const notes = form.notes.trim();
    const roofTypeLabel = getRoofTypeLabel(form.roofType);
    const combinedNotes = roofTypeLabel
      ? [notes, `Roof type: ${roofTypeLabel}`].filter((value) => Boolean(value && value.trim())).join('\n\n')
      : notes;

    const basePayload = buildContactLeadPayload({
      projectType: form.projectType,
      timelineLabel: timelineLabel || undefined,
      notes: combinedNotes.trim() || undefined,
      preferredContact: DEFAULT_PREFERRED_CONTACT,
      bestTimeLabel: 'No preference',
      consentSms: form.consentSms,
      identity: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
      },
      address: {
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        state: form.state,
        zip: form.zip,
      },
      page: page || '/contact-us',
    });

    const contactPayload: ContactLeadInput = {
      ...basePayload,
      cfToken,
      hp_field: honeypot || undefined,
    };

    if (utmParams.source) contactPayload.utm_source = utmParams.source;
    if (utmParams.medium) contactPayload.utm_medium = utmParams.medium;
    if (utmParams.campaign) contactPayload.utm_campaign = utmParams.campaign;

    const payload: ContactLeadInput & { submittedAt: string } = {
      ...contactPayload,
      submittedAt: new Date().toISOString(),
    };

    const result = await submitLead(payload, {
      gtmEvent: {
        event: 'lead_form_submitted',
        projectType: form.projectType,
        helpTopics: '',
      },
      metaPixelEvents: ['Lead', 'Contact'],
    });

    if (!result.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Lead submission failed', result);
      }
      setStatus('error');
      setGlobalError(result.error || 'We could not send your message. Please call us at (941) 866-4320.');
      if (result.fieldErrors) {
        const serverErrors = Object.entries(result.fieldErrors).reduce<Record<string, string>>((acc, [key, messages]) => {
          if (Array.isArray(messages) && messages.length) {
            acc[key] = String(messages[0]);
          }
          return acc;
        }, {});
        if (Object.keys(serverErrors).length) {
          setErrors(serverErrors);
        }
      }
      return;
    }

    const successPayload: LeadSuccessCookiePayload = {
      projectType: form.projectType,
      helpTopics: [],
      helpTopicLabels: [],
      timeline: form.timeline,
      timelineLabel: timelineLabel || undefined,
      notes: notes || undefined,
      roofTypeLabel: roofTypeLabel || undefined,
      timestamp: new Date().toISOString(),
    };
    persistLeadSuccessCookie(successPayload);
    setSuccessMeta(buildSuccessMetaFromPayload(successPayload));

    setForm(buildInitialState(initialProjectType));
    setErrors({});
    setGlobalError(null);
    setStatus('success');
  };

  const handleResetSuccess = () => {
    deleteCookie(LEAD_SUCCESS_COOKIE);
    setSuccessMeta(null);
    setStatus('idle');
    setGlobalError(null);
    setForm(buildInitialState(initialProjectType));
  };

  if (status === 'success' && successMeta) {
    return (
      <>
        <div id="book-an-appointment" className="h-0" aria-hidden="true" />
        <LeadFormSuccess successMeta={successMeta} onReset={handleResetSuccess} maxWidthClassName="max-w-5xl" />
      </>
    );
  }

  return (
    <>
      <div id="book-an-appointment" className="h-0" aria-hidden="true" />
      <form className="not-prose" onSubmit={handleSubmit} noValidate>
        {/* SECRET CIA HONEYPOT */}
        <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />
        {/* OK, BACK TO THE SHOW */}
        <div className="mx-auto w-full rounded-3xl border border-blue-100 bg-white shadow-md">
          <div className="border-b rounded-t-3xl border-blue-100 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-6">
            <h2 className="flex items-center text-3xl font-bold gap-2">
              <span>{renderHighlight(title ?? DEFAULT_TITLE, titleHighlight ?? DEFAULT_TITLE_HIGHLIGHT)}</span>
            </h2>
            <p className="text-slate-500 mt-1 text-sm md:text-base pb-2">
              {description ?? DEFAULT_DESCRIPTION}
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {globalError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {globalError}
              </div>
            )}

            <div className="grid gap-8">
              <section>
                <div className="grid my-4 gap-4 md:grid-cols-2">
                  <label className="block font-medium text-slate-700">
                    First Name*
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) => setField('firstName', event.target.value)}
                      className={cn(INPUT_BASE_CLASS, errors.firstName && INPUT_ERROR_CLASS)}
                      placeholder="First Name"
                    />
                    {errors.firstName && <span className="mt-1 text-xs text-red-600">{errors.firstName}</span>}
                  </label>
                  <label className="block font-medium text-slate-700">
                    Last Name*
                    <input
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(event) => setField('lastName', event.target.value)}
                      className={cn(INPUT_BASE_CLASS, errors.lastName && INPUT_ERROR_CLASS)}
                      placeholder="Last Name"
                    />
                    {errors.lastName && <span className="mt-1 text-xs text-red-600">{errors.lastName}</span>}
                  </label>
                </div>

                <section className="grid gap-4 md:grid-cols-2">
                  <label className="block font-medium text-slate-700">
                    Email*
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      className={cn(INPUT_BASE_CLASS, errors.email && INPUT_ERROR_CLASS)}
                      placeholder="example@domain.com"
                    />
                    {errors.email && <span className="mt-1 text-xs text-red-600">{errors.email}</span>}
                  </label>
                  <label className="block font-medium text-slate-700">
                    Phone*
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => setField('phone', sanitizePhoneInput(event.target.value))}
                      className={cn(INPUT_BASE_CLASS, errors.phone && INPUT_ERROR_CLASS)}
                      inputMode="tel"
                      placeholder={`Example: ${formatPhoneExample(form.phone)}`}
                    />
                    {errors.phone && <span className="mt-1 text-xs text-red-600">{errors.phone}</span>}
                  </label>
                </section>

                <section className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block font-medium text-slate-700">
                    Address*
                    <input
                      type="text"
                      name="address1"
                      autoComplete="address-line1"
                      value={form.address1}
                      onChange={(event) => setField('address1', event.target.value)}
                      className={cn(INPUT_BASE_CLASS, errors.address1 && INPUT_ERROR_CLASS)}
                      placeholder="123 Sesame St."
                    />
                    {errors.address1 && <span className="mt-1 text-xs text-red-600">{errors.address1}</span>}
                  </label>
                  <label className="block text-slate-500">
                    Apt, suite, etc. (optional)
                    <input
                      type="text"
                      name="address2"
                      autoComplete="address-line2"
                      value={form.address2}
                      onChange={(event) => setField('address2', event.target.value)}
                      className={cn(INPUT_BASE_CLASS)}
                    />
                  </label>
                </section>
                <section className="mt-4 flex flex-row w-full gap-2">
                  <label className="block font-medium text-slate-700">
                    City*
                    <input
                      type="text"
                      name="city"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(event) => setField('city', event.target.value)}
                      className={cn(INPUT_BASE_CLASS, errors.city && INPUT_ERROR_CLASS)}
                      placeholder="City"
                    />
                    {errors.city && <span className="mt-1 text-xs text-red-600">{errors.city}</span>}
                  </label>
                  <label className="block font-medium text-slate-700">
                    State*
                    <input
                      type="text"
                      name="state"
                      autoComplete="address-level1"
                      value={form.state}
                      onChange={(event) => setField('state', normalizeState(event.target.value))}
                      className={cn(INPUT_BASE_CLASS, errors.state && INPUT_ERROR_CLASS)}
                      maxLength={2}
                    />
                    {errors.state && <span className="mt-1 text-xs text-red-600">{errors.state}</span>}
                  </label>
                  <label className="block font-medium text-slate-700">
                    ZIP*
                    <input
                      type="text"
                      name="zip"
                      autoComplete="postal-code"
                      value={form.zip}
                      onChange={(event) => setField('zip', normalizeZip(event.target.value))}
                      className={cn(INPUT_BASE_CLASS, errors.zip && INPUT_ERROR_CLASS)}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="ZIP"
                    />
                    {errors.zip && <span className="mt-1 text-xs text-red-600">{errors.zip}</span>}
                  </label>
                </section>
              </section>

              <section>
                <h3 className={SECTION_TITLE_BASE_CLASS}>How soon would you like to start?</h3>
                <p className={SECTION_EYELASH}>Share a timeline if you have one</p>
                <div className="mt-3 grid gap-3 grid-cols-3 sm:grid-cols-6">
                  {STANDARD_TIMELINE_OPTIONS.map(({ value, label }) => {
                    const selected = form.timeline === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField('timeline', value)}
                        className={cn(
                          'font-medium text-slate-600 rounded-xl border px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                          selected
                            ? 'border-[--brand-blue] bg-[--brand-blue] text-white shadow'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
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
                <h3 className={SECTION_TITLE_BASE_CLASS}>What type of roof do you currently have?</h3>
                <p className={SECTION_EYELASH}>Helps us prep for your project</p>
                <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-4">
                  {ROOF_TYPE_OPTIONS.map(({ value, label, imageSrc, imageAlt }) => {
                    const selected = form.roofType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField('roofType', value)}
                        className={cn(
                          'group flex flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                          selected
                            ? 'border-[--brand-blue] bg-[--brand-blue]/5 shadow-[0_8px_20px_rgba(15,76,129,0.12)]'
                            : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                        )}
                        aria-pressed={selected}
                      >
                        <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 aspect-[5/2]">
                          <Image
                            src={imageSrc}
                            alt={imageAlt}
                            fill
                            sizes="(min-width: 768px) 320px, 100vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{label}</p>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-inner">
                            <Check className={cn('h-4 w-4', selected ? 'text-[--brand-blue]' : 'text-slate-300')} aria-hidden="true" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <label className="block ">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-600">Anything else you’d like us to know? (optional) </h3>
                  <textarea
                    name="notes"
                    rows={4}
                    value={form.notes}
                    onChange={(event) => setField('notes', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30"
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
                    By submitting this form, you agree to receive transactional and promotional communications from SonShine Roofing. Message
                    frequency may vary. Message and data rates may apply. Reply STOP to opt out at any time.
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
                <Button type="submit" size="xl" variant="brandOrange" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : 'Submit Request'}
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
