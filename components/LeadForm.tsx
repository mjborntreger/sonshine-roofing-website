'use client';

import { FormEvent, useMemo, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock4,
  Droplets,
  Hammer,
  Home,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Sparkles,
  SunDim,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Turnstile from '@/components/Turnstile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PROJECT_OPTIONS = [
  {
    value: 'emergency-leak',
    label: 'Emergency leak help',
    description: 'Water coming in or ceiling damage right now',
    icon: Droplets,
    accent: 'border-rose-200 bg-rose-50 text-rose-600',
  },
  {
    value: 'storm-damage',
    label: 'Storm or hurricane damage',
    description: 'Insurance paperwork, tarps, and wind-driven leaks',
    icon: ShieldCheck,
    accent: 'border-sky-200 bg-sky-50 text-sky-600',
  },
  {
    value: 'replacement',
    label: 'Plan a roof replacement',
    description: 'Ready to compare options for a new roofing system',
    icon: Hammer,
    accent: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  {
    value: 'maintenance',
    label: 'Maintenance or inspection',
    description: 'Annual checkups, seller/buyer reports, tune-ups',
    icon: Sparkles,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  },
  {
    value: 'something-else',
    label: 'Something else',
    description: 'Gutters, skylights, or just have a few questions',
    icon: MessageCircle,
    accent: 'border-violet-200 bg-violet-50 text-violet-600',
  },
] as const;

const SITUATION_OPTIONS = [
  {
    value: 'active-leak',
    label: 'We have an active leak',
    description: 'There is water inside or the interior is compromised',
    icon: Droplets,
  },
  {
    value: 'visible-damage',
    label: 'We can see roof damage',
    description: 'Missing shingles, lifted tiles, or debris on the roof',
    icon: AlertTriangle,
  },
  {
    value: 'aging-out',
    label: 'Roof is aging out',
    description: 'It’s close to the end of its lifespan and we want a plan',
    icon: SunDim,
  },
  {
    value: 'inspection-needed',
    label: 'Need an inspection report',
    description: 'For insurance, sale, or peace of mind before hurricane season',
    icon: ShieldCheck,
  },
  {
    value: 'just-researching',
    label: 'Mostly researching options',
    description: 'Gathering ideas, timelines, and investment ranges',
    icon: TrendingUp,
  },
] as const;

const TIMELINE_OPTIONS = [
  { value: 'within-48-hours', label: 'Within 48 hours', description: 'It’s urgent and we need the crew fast' },
  { value: 'this-week', label: 'This week', description: 'Soon, but not a midnight emergency' },
  { value: 'this-month', label: 'This month', description: 'Planning within the next few weeks' },
  { value: 'next-few-months', label: 'In the next 2–3 months', description: 'Researching contractors & scheduling' },
  { value: 'not-sure', label: 'Not sure yet', description: 'Need guidance on what makes sense' },
] as const;

const CONTACT_PREF_OPTIONS = [
  { value: 'phone-call', label: 'Phone call', icon: Phone },
  { value: 'text-message', label: 'Text message', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: Home },
] as const;

const BEST_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (8–11am)' },
  { value: 'midday', label: 'Midday (11–2pm)' },
  { value: 'afternoon', label: 'Afternoon (2–5pm)' },
  { value: 'evening', label: 'After 5pm' },
] as const;

type StepId = 'need' | 'context' | 'contact' | 'schedule';

interface FormState {
  projectType: string;
  roofSituation: string;
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
  preferredContact: string;
  bestTime: string;
  consentSms: boolean;
}

const INITIAL_STATE: FormState = {
  projectType: '',
  roofSituation: '',
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
  preferredContact: 'phone-call',
  bestTime: '',
  consentSms: true,
};

interface FieldErrors {
  [key: string]: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 15);
}

function formatPhoneExample(phone: string): string {
  const digits = sanitizePhoneInput(phone || '9415551234');
  if (digits.length < 10) return '(941) 555-1234';
  const area = digits.slice(0, 3);
  const mid = digits.slice(3, 6);
  const last = digits.slice(6, 10);
  return `(${area}) ${mid}-${last}`;
}

function validateEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim().toLowerCase());
}

type Action = { type: 'update'; field: keyof FormState; value: FormState[keyof FormState] } | { type: 'reset' };

function formReducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'reset':
      return INITIAL_STATE;
    case 'update':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

const STEP_ORDER: StepId[] = ['need', 'context', 'contact', 'schedule'];

function validateStep(step: StepId, data: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 'need') {
    if (!data.projectType) errors.projectType = 'Pick the option that fits best.';
  }
  if (step === 'context') {
    if (!data.roofSituation) errors.roofSituation = 'Tell us what’s happening with the roof.';
    if (!data.timeline) errors.timeline = 'Choose when you’d like help.';
  }
  if (step === 'contact') {
    if (!data.firstName.trim()) errors.firstName = 'Enter your first name.';
    if (!data.lastName.trim()) errors.lastName = 'Enter your last name.';
    if (!validateEmail(data.email)) errors.email = 'Enter a valid email (example@domain.com).';
    const digits = sanitizePhoneInput(data.phone);
    if (!(digits.length === 10 || digits.length === 11)) {
      errors.phone = 'Enter a 10-digit phone number (add country code if needed).';
    }
  }
  if (step === 'schedule') {
    if (!data.address1.trim()) errors.address1 = 'Enter your street address.';
    if (!data.city.trim()) errors.city = 'City is required.';
    if (!data.state.trim()) errors.state = 'State is required.';
    if (sanitizePhoneInput(data.zip).length !== 5 && data.zip.trim().length !== 5) {
      errors.zip = 'ZIP should be 5 digits.';
    }
    if (!data.bestTime) errors.bestTime = 'Pick the time that works best.';
  }
  return errors;
}

export default function LeadForm() {
  const [form, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const reduceMotion = useReducedMotion();

  const activeStepId = STEP_ORDER[activeStepIndex];
  const totalSteps = STEP_ORDER.length;

  const utm = useMemo(() => {
    const source = searchParams?.get('utm_source') || undefined;
    const medium = searchParams?.get('utm_medium') || undefined;
    const campaign = searchParams?.get('utm_campaign') || undefined;
    return { source, medium, campaign };
  }, [searchParams]);

  const onSelect = (field: keyof FormState, value: FormState[keyof FormState]) => {
    dispatch({ type: 'update', field, value });
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleNext = () => {
    const currentStepId = STEP_ORDER[activeStepIndex];
    const validation = validateStep(currentStepId, form);
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setGlobalError(null);
    setActiveStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setErrors({});
    setGlobalError(null);
    setActiveStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const validation = validateStep('schedule', form);
    if (Object.keys(validation).length) {
      setErrors(validation);
      setActiveStepIndex(STEP_ORDER.indexOf('schedule'));
      return;
    }

    const fullValidation = STEP_ORDER.reduce<FieldErrors>((acc, step) => {
      const result = validateStep(step, form);
      return { ...acc, ...result };
    }, {});
    if (Object.keys(fullValidation).length) {
      setErrors(fullValidation);
      const firstErrorStepIndex = STEP_ORDER.findIndex((step) => {
        const stepErrors = Object.keys(validateStep(step, form));
        return stepErrors.some((key) => fullValidation[key]);
      });
      if (firstErrorStepIndex >= 0) setActiveStepIndex(firstErrorStepIndex);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const cfToken = String(formData.get('cfToken') || '');
    const honeypot = String(formData.get('company') || '');

    if (!cfToken) {
      setGlobalError('Please complete the verification to continue.');
      setErrors((prev) => ({ ...prev, cfToken: 'Verification required.' }));
      return;
    }

    setStatus('submitting');
    setGlobalError(null);

    const payload: Record<string, unknown> = {
      type: 'contact-lead',
      projectType: form.projectType,
      roofSituation: form.roofSituation,
      timeline: form.timeline,
      notes: form.notes.trim() || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: sanitizePhoneInput(form.phone),
      address1: form.address1.trim(),
      address2: form.address2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim(),
      preferredContact: form.preferredContact,
      bestTime: form.bestTime,
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
      const res = await fetch('/api/zapier-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Unable to send your request.');
      }
      setStatus('success');
      setErrors({});
      try {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: 'lead_form_submitted',
          projectType: form.projectType,
          roofSituation: form.roofSituation,
        });
      } catch {}
    } catch (error: any) {
      console.error('Lead submission failed', error);
      setStatus('error');
      setGlobalError(error?.message || 'We could not send your message. Please call us at (941) 866-4320.');
    }
  };

  const getStepMeta = (stepId: StepId) => {
    switch (stepId) {
      case 'need':
        return {
          title: 'Let’s get started',
          description: 'We’ll tailor the next few questions so we can route you to the right specialist.',
        };
      case 'context':
        return {
          title: 'What’s happening with your roof?',
          description: 'A little context helps us prep the right crew, equipment, and answers.',
        };
      case 'contact':
        return {
          title: 'How can we reach you?',
          description: 'We respond within 30 minutes during business hours — faster if it’s an emergency.',
        };
      case 'schedule':
        return {
          title: 'Where are you located?',
          description: 'Confirm the service address and the best time to connect.',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const { title, description } = getStepMeta(activeStepId);
  const progressPercent = ((activeStepIndex + 1) / totalSteps) * 100;

  const stepTransition = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 },
        transition: { duration: 0.3, ease: 'easeOut' as const },
      };

  if (status === 'success') {
    return (
      <div className="mt-8 rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
          <h3 className="mt-4 text-2xl font-semibold text-slate-900">We’ve got it — thank you!</h3>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Your message is already on the way to our project support team. We’ll reach out shortly with next steps.
            If a storm is moving in or water is coming inside, call us right now at{' '}
            <a className="font-semibold text-[--brand-blue]" href="tel:+19418664320">(941) 866-4320</a>.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" /> Licensed &amp; insured
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <Clock4 className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" /> Typical response under 30 minutes
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" /> 4.8 rating on Google
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="mt-8 mb-24" onSubmit={handleSubmit} noValidate>
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="projectType" value={form.projectType} />
      <input type="hidden" name="roofSituation" value={form.roofSituation} />
      <input type="hidden" name="timeline" value={form.timeline} />
      <input type="hidden" name="preferredContact" value={form.preferredContact} />
      <input type="hidden" name="bestTime" value={form.bestTime} />
      <input type="hidden" name="notes" value={form.notes} />

      <div id="get-started"className="overflow-hidden mx-4 rounded-3xl border border-blue-100 bg-white/95 shadow-xl">
        <div className="border-b border-blue-50 bg-gradient-to-r from-sky-50 via-white to-amber-50 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[--brand-blue]">Step {activeStepIndex + 1} of {totalSteps}</p>
              <h3 className="mt-3 mb-8 text-4xl md:text-5xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-500">Live in Sarasota, Manatee &amp; Charlotte Counties</p>
              <p className="mt-1 text-sm text-slate-500">Since 1987 we've got you covered</p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-[--brand-blue] transition-[width]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="px-6 py-6">
          {globalError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeStepId} {...stepTransition}>
              {activeStepId === 'need' && (
                <div className="grid gap-4 md:grid-cols-2">
                  {PROJECT_OPTIONS.map(({ value, label, description, icon: Icon, accent }) => {
                    const selected = form.projectType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onSelect('projectType', value)}
                        className={cn(
                          'group flex h-full flex-col justify-between rounded-2xl border bg-white px-4 py-5 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
                          <h4 className="mt-4 text-lg font-semibold text-slate-900">{label}</h4>
                          <p className="mt-2 text-sm text-slate-600">{description}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>Guided resources included</span>
                          <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" aria-hidden="true" />
                        </div>
                      </button>
                    );
                  })}
                  {errors.projectType && (
                    <p className="md:col-span-2 text-sm font-medium text-red-600">{errors.projectType}</p>
                  )}
                </div>
              )}

              {activeStepId === 'context' && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">What’s happening?</h4>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {SITUATION_OPTIONS.map(({ value, label, description, icon: Icon }) => {
                          const selected = form.roofSituation === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => onSelect('roofSituation', value)}
                              className={cn(
                                'flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                selected
                                  ? 'border-[--brand-blue] bg-[--brand-blue]/5 shadow-[0_8px_20px_rgba(15,76,129,0.12)]'
                                  : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                              )}
                              aria-pressed={selected}
                            >
                              <Icon className={cn('h-6 w-6 shrink-0', selected ? 'text-[--brand-blue]' : 'text-slate-400')} aria-hidden="true" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{label}</p>
                                <p className="mt-1 text-xs text-slate-500">{description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.roofSituation && <p className="mt-2 text-sm font-medium text-red-600">{errors.roofSituation}</p>}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timeline</h4>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TIMELINE_OPTIONS.map(({ value, label, description }) => {
                          const selected = form.timeline === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => onSelect('timeline', value)}
                              className={cn(
                                'rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                selected
                                  ? 'border-[--brand-blue] bg-[--brand-blue] text-white shadow'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                              )}
                              aria-pressed={selected}
                              title={description}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {errors.timeline && <p className="mt-2 text-sm font-medium text-red-600">{errors.timeline}</p>}
                    </div>

                    <div>
                      <label htmlFor="notes" className="text-sm font-semibold text-slate-700">
                        Anything else you’d like us to know?
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-900 shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30"
                        placeholder="Example: We already have tarps down, or insurance adjuster scheduled Friday."
                        value={form.notes}
                        onChange={(event) => onSelect('notes', event.target.value)}
                      />
                    </div>
                  </div>
                  <aside className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-sm text-slate-600">
                    <div className="flex items-start gap-3">
                      <CalendarClock className="mt-1 h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-slate-800">Need us tonight?</p>
                        <p className="mt-1">Call <a href="tel:+19418664320" className="font-semibold text-[--brand-blue]">(941) 866-4320</a> and we’ll fast-track your request.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-1 h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-slate-800">We’ll prep resources for you</p>
                        <p className="mt-1">Based on your answers we’ll send links, FAQs, or financing options that fit.</p>
                      </div>
                    </div>
                  </aside>
                </div>
              )}

              {activeStepId === 'contact' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    First name*
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) => onSelect('firstName', event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.firstName ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.firstName)}
                    />
                    {errors.firstName && <span className="mt-1 text-xs text-red-600">{errors.firstName}</span>}
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    Last name*
                    <input
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(event) => onSelect('lastName', event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.lastName ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.lastName)}
                    />
                    {errors.lastName && <span className="mt-1 text-xs text-red-600">{errors.lastName}</span>}
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    Email*
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => onSelect('email', event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <span className="mt-1 text-xs text-red-600">{errors.email}</span>}
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    Phone*
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(event) => onSelect('phone', event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.phone ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <span className="mt-1 text-xs text-red-600">{errors.phone}</span>}
                    <p className="mt-1 text-xs text-slate-500">Digits only is great. Example: {formatPhoneExample(form.phone)}</p>
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred contact method</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {CONTACT_PREF_OPTIONS.map(({ value, label, icon: Icon }) => {
                        const selected = form.preferredContact === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onSelect('preferredContact', value)}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                              selected ? 'border-[--brand-blue] bg-[--brand-blue] text-white shadow' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            )}
                            aria-pressed={selected}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeStepId === 'schedule' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                    Street address*
                    <input
                      type="text"
                      name="address1"
                      autoComplete="street-address"
                      value={form.address1}
                      onChange={(event) => onSelect('address1', event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.address1 ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.address1)}
                    />
                    {errors.address1 && <span className="mt-1 text-xs text-red-600">{errors.address1}</span>}
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    Unit / suite (optional)
                    <input
                      type="text"
                      name="address2"
                      autoComplete="address-line2"
                      value={form.address2}
                      onChange={(event) => onSelect('address2', event.target.value)}
                      className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30"
                    />
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    City*
                    <input
                      type="text"
                      name="city"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(event) => onSelect('city', event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.city ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.city)}
                    />
                    {errors.city && <span className="mt-1 text-xs text-red-600">{errors.city}</span>}
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    State*
                    <input
                      type="text"
                      name="state"
                      autoComplete="address-level1"
                      value={form.state}
                      onChange={(event) => onSelect('state', event.target.value.toUpperCase().slice(0, 2))}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm uppercase shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.state ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.state)}
                    />
                    {errors.state && <span className="mt-1 text-xs text-red-600">{errors.state}</span>}
                  </label>

                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    ZIP*
                    <input
                      type="text"
                      name="zip"
                      inputMode="numeric"
                      maxLength={5}
                      autoComplete="postal-code"
                      value={form.zip}
                      onChange={(event) => onSelect('zip', event.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      className={cn(
                        'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30',
                        errors.zip ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200'
                      )}
                      aria-invalid={Boolean(errors.zip)}
                    />
                    {errors.zip && <span className="mt-1 text-xs text-red-600">{errors.zip}</span>}
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">When should we connect?</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {BEST_TIME_OPTIONS.map(({ value, label }) => {
                        const selected = form.bestTime === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onSelect('bestTime', value)}
                            className={cn(
                              'rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
                    {errors.bestTime && <p className="mt-2 text-sm font-medium text-red-600">{errors.bestTime}</p>}
                  </div>

                  <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      name="consentSms"
                      checked={form.consentSms}
                      onChange={(event) => onSelect('consentSms', event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[--brand-blue] focus:ring-[--brand-blue]"
                    />
                    <span>
                      Yes, you may send me service updates by SMS. Message and data rates may apply. Reply STOP to opt out.
                    </span>
                  </label>

                  <div className="md:col-span-2">
                    <Turnstile className="pt-1" action="lead-form" />
                    {errors.cfToken && <p className="mt-2 text-sm font-medium text-red-600">{errors.cfToken}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4 border-t border-blue-50 bg-slate-50/80 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
              Trusted locally since 1987
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <UserRound className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
              Roof advisors, not call center scripts
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {activeStepIndex > 0 && (
              <Button type="button" data-icon-affordance="left" variant="secondary" size="sm" onClick={handleBack} className="gap-2">
                <ArrowLeft className="icon-affordance h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            )}
            {activeStepIndex < totalSteps - 1 && (
              <Button type="button" data-icon-affordance="right" variant="brandBlue" size="sm" onClick={handleNext} className="gap-2">
                Continue
                <ArrowRight className="icon-affordance h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {activeStepIndex === totalSteps - 1 && (
              <Button type="submit" variant="brandOrange" size="sm" disabled={status === 'submitting'} className="gap-2">
                {status === 'submitting' ? 'Sending…' : 'Submit my request'}
                {status !== 'submitting' && <Check className="h-4 w-4" aria-hidden="true" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
