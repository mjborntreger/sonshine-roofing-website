'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  UserRound,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deleteCookie } from '@/lib/telemetry/client-cookies';
import {
  LEAD_SUCCESS_COOKIE,
  LeadSuccessCookiePayload,
  SuccessMeta,
  DEFAULT_PREFERRED_CONTACT,
  type PreferredContactValue,
  sanitizePhoneInput,
  formatPhoneExample,
  normalizeState,
  normalizeZip,
  persistLeadSuccessCookie,
  submitLead,
  type ContactLeadInput,
  buildContactLeadPayload,
  type ContactLeadResourceLink,
  validateContactIdentityDraft,
  validateContactAddressDraft,
} from '@/lib/lead-capture/contact-lead';
import SmartLink from '@/components/utils/SmartLink';
import {
  BEST_TIME_OPTIONS,
  CONTACT_PREF_OPTIONS,
  PROJECT_OPTIONS,
  getJourneyConfig,
  getHelpTopicLabelsForDisplay,
  getSuccessLinks,
  getTimelineLabelForDisplay,
  isJourneyKey,
  restoreLeadSuccessState,
} from '@/components/lead-capture/lead-form/config';
import type { JourneyKey, LeadSuccessRestore, ProjectOption, LeadFormUtmParams } from '@/components/lead-capture/lead-form/config';
import { renderHighlight } from '@/components/utils/renderHighlight';

const Turnstile = dynamic(() => import('@/components/lead-capture/Turnstile'), { ssr: false });
const LeadFormSuccess = dynamic(() => import('@/components/lead-capture/lead-form/LeadFormSuccess'), {
  ssr: false,
  loading: () => null,
});

const INPUT_BASE_CLASS =
  'mt-2 w-full rounded-full border px-4 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30';
const INPUT_DEFAULT_CLASS = 'border-slate-200';
const INPUT_ERROR_CLASS = 'border-red-300 focus:border-red-400 focus:ring-red-200';

const SELECTION_PILL_BASE_CLASS =
  'rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const SELECTION_PILL_SELECTED_CLASS = 'border-[--brand-blue] bg-[--brand-blue] text-white shadow';
const SELECTION_PILL_UNSELECTED_CLASS = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';

const HELP_BUTTON_BASE_CLASS =
  'flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const HELP_BUTTON_SELECTED_CLASS = 'border-[--brand-blue] bg-[--brand-blue]/5 shadow-[0_8px_20px_rgba(15,76,129,0.12)]';
const HELP_BUTTON_UNSELECTED_CLASS =
  'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md';

const INFO_BADGE_CLASS = 'inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1';

type LeadFormWizardProps = {
  restoredSuccess?: LeadSuccessRestore | null;
  initialJourney?: JourneyKey | null;
  onResetSuccess?: () => void;
  utm?: LeadFormUtmParams;
};







type StepId = 'need' | 'context' | 'contact' | 'schedule';

interface FormState {
  projectType: string;
  helpTopics: string[];
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
  preferredContact: PreferredContactValue;
  bestTime: string;
  consentSms: boolean;
}

const INITIAL_STATE: FormState = {
  projectType: '',
  helpTopics: [],
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
  preferredContact: DEFAULT_PREFERRED_CONTACT,
  bestTime: '',
  consentSms: false,
};

interface FieldErrors {
  [key: string]: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';









type Action =
  | { type: 'update'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'reset' }
  | { type: 'merge'; values: Partial<FormState> };

function formReducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'reset':
      return INITIAL_STATE;
    case 'merge':
      return { ...state, ...action.values };
    case 'update':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

const STEP_ORDER: StepId[] = ['need', 'context', 'contact', 'schedule'];

const STEP_FIELD_KEYS: Record<StepId, ReadonlyArray<keyof FormState>> = {
  need: ['projectType'],
  context: ['helpTopics', 'timeline', 'notes'],
  contact: ['firstName', 'lastName', 'email', 'phone'],
  schedule: ['address1', 'city', 'state', 'zip', 'bestTime'],
};

function validateStep(step: StepId, data: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 'need') {
    if (!data.projectType) errors.projectType = 'Pick the option that fits best.';
  }
  if (step === 'context') {
    const journey = getJourneyConfig(data.projectType);
    if (!journey) {
      errors.projectType = 'Pick the option that fits best.';
    } else {
      if (journey.showHelpMulti && (!Array.isArray(data.helpTopics) || data.helpTopics.length === 0)) {
        errors.helpTopics = 'Select at least one option.';
      }
      if (journey.showTimeline && !data.timeline) {
        errors.timeline = 'Choose when you’d like help.';
      }
      if (journey.requireNotes && !data.notes.trim()) {
        errors.notes = 'Tell us a bit more about your situation.';
      }
    }
  }
  if (step === 'contact') {
    if (!data.firstName.trim()) errors.firstName = 'Enter your first name.';
    if (!data.lastName.trim()) errors.lastName = 'Enter your last name.';
    const identityErrors = validateContactIdentityDraft({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });
    Object.assign(errors, identityErrors);
  }
  if (step === 'schedule') {
    const addressErrors = validateContactAddressDraft({
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.state,
      zip: data.zip,
    });
    Object.assign(errors, addressErrors);
    if (!data.bestTime) errors.bestTime = 'Pick the time that works best.';
  }
  return errors;
}

export default function LeadFormWizard({
  restoredSuccess: restoredSuccessProp,
  initialJourney: initialJourneyProp,
  onResetSuccess,
  utm: utmProp,
}: LeadFormWizardProps = {}) {
  const router = useRouter();
  const restoredSuccess = useMemo(
    () => restoredSuccessProp ?? restoreLeadSuccessState(),
    [restoredSuccessProp]
  );
  const initialJourney = restoredSuccess
    ? null
    : initialJourneyProp && isJourneyKey(initialJourneyProp)
      ? initialJourneyProp
      : null;
  const [form, dispatch] = useReducer(
    formReducer,
    INITIAL_STATE,
    (initial) => {
      if (restoredSuccess) return { ...initial, ...restoredSuccess.formPreset };
      if (initialJourney) return { ...initial, projectType: initialJourney };
      return initial;
    }
  );
  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    if (restoredSuccess) return STEP_ORDER.length - 1;
    if (initialJourney) return 1;
    return 0;
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>(restoredSuccess ? 'success' : 'idle');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const reduceMotion = useReducedMotion();
  const prevStepRef = useRef(0);
  const delayScrollTimeoutRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);
  const [successMeta, setSuccessMeta] = useState<SuccessMeta | null>(restoredSuccess?.meta ?? null);

  const activeStepId = STEP_ORDER[activeStepIndex];
  const totalSteps = STEP_ORDER.length;
  const journey = getJourneyConfig(form.projectType);
  const helpSummary = useMemo(() => (form.helpTopics.length ? form.helpTopics.join(', ') : ''), [form.helpTopics]);

  const utm = useMemo(() => utmProp ?? {}, [utmProp]);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  const onSelect = <K extends keyof FormState>(field: K, value: FormState[K]) => {
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

  const handleProjectOption = (option: ProjectOption) => {
    if (option.action === 'link' && option.href) {
      router.push(option.href as Route);
      return;
    }
    if (option.action === 'advance' && isJourneyKey(option.value)) {
      dispatch({
        type: 'merge',
        values: {
          projectType: option.value,
          helpTopics: [],
          timeline: '',
          notes: '',
        },
      });
      setErrors({});
      setGlobalError(null);
      setActiveStepIndex(1);
    }
  };

  const handleHelpToggle = (value: string) => {
    const next = form.helpTopics.includes(value)
      ? form.helpTopics.filter((item) => item !== value)
      : [...form.helpTopics, value];
    onSelect('helpTopics', next);
  };

  const handleTimelineSelect = (value: string) => {
    onSelect('timeline', value);
  };

  const handleResetSuccess = () => {
    deleteCookie(LEAD_SUCCESS_COOKIE);
    setSuccessMeta(null);
    setStatus('idle');
    setErrors({});
    setGlobalError(null);
    setActiveStepIndex(0);
    dispatch({ type: 'reset' });
    onResetSuccess?.();
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }
  };

  useEffect(() => {
    const previous = prevStepRef.current;
    prevStepRef.current = activeStepIndex;
    if (activeStepIndex === previous) return;
    if (typeof window === 'undefined') return;
    const container = formRef.current;
    if (!container) return;

    const performScroll = () => {
      const behavior = reduceMotion ? 'auto' : 'smooth';
      window.requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const offset = 28;
        const target = Math.max(rect.top + window.scrollY - offset, 0);
        window.scrollTo({ top: target, behavior });
      });
    };

    if (activeStepIndex < previous && !reduceMotion) {
      if (delayScrollTimeoutRef.current != null) {
        window.clearTimeout(delayScrollTimeoutRef.current);
        delayScrollTimeoutRef.current = null;
      }
      delayScrollTimeoutRef.current = window.setTimeout(performScroll, 300);
    } else {
      performScroll();
    }
  }, [activeStepIndex, reduceMotion]);

  useEffect(() => {
    return () => {
      if (delayScrollTimeoutRef.current != null) {
        window.clearTimeout(delayScrollTimeoutRef.current);
        delayScrollTimeoutRef.current = null;
      }
    };
  }, []);

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

    const timelineLabel = form.timeline
      ? journey?.timelineOptions.find((option) => option.value === form.timeline)?.label || form.timeline
      : '';
    const bestTimeLabel = form.bestTime
      ? BEST_TIME_OPTIONS.find((option) => option.value === form.bestTime)?.label || form.bestTime
      : '';
    const notesText = form.notes.trim();
    const resourceLinksForPayload: ContactLeadResourceLink[] = getSuccessLinks(form.projectType).map(
      ({ label, description, href, external }) => ({
        label,
        description,
        href,
        external,
      })
    );

    const basePayload = buildContactLeadPayload({
      projectType: form.projectType,
      helpSummary: helpSummary || undefined,
      timelineLabel: timelineLabel || undefined,
      notes: notesText || undefined,
      preferredContact: form.preferredContact,
      bestTimeLabel: bestTimeLabel || undefined,
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
      resourceLinks: resourceLinksForPayload,
      page: '/contact-us',
    });

    const contactPayload: ContactLeadInput = {
      ...basePayload,
      cfToken,
      hp_field: honeypot || undefined,
    };

    if (utm.source) contactPayload.utm_source = utm.source;
    if (utm.medium) contactPayload.utm_medium = utm.medium;
    if (utm.campaign) contactPayload.utm_campaign = utm.campaign;

    const payload: ContactLeadInput & { submittedAt: string } = {
      ...contactPayload,
      submittedAt: new Date().toISOString(),
    };

    const result = await submitLead(payload, {
      gtmEvent: {
        event: 'lead_form_submitted',
        projectType: form.projectType,
        helpTopics: helpSummary,
      },
    });

    if (!result.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Lead submission failed', result);
      }
      setStatus('error');
      setGlobalError(result.error || 'We could not send your message. Please call us at (941) 866-4320.');
      if (result.fieldErrors) {
        const serverErrors = Object.entries(result.fieldErrors).reduce<FieldErrors>((acc, [key, messages]) => {
          if (Array.isArray(messages) && messages.length) {
            acc[key] = String(messages[0]);
          }
          return acc;
        }, {});
        if (Object.keys(serverErrors).length) {
          setErrors(serverErrors);
          const firstErrorStepIndex = STEP_ORDER.findIndex((step) =>
            STEP_FIELD_KEYS[step].some((field) => field in serverErrors)
          );
          if (firstErrorStepIndex >= 0) {
            setActiveStepIndex(firstErrorStepIndex);
          }
        }
      }
      return;
    }

    setStatus('success');
    setErrors({});
    setGlobalError(null);
    const helpTopicLabels = getHelpTopicLabelsForDisplay(form.projectType, form.helpTopics);
    const timelineLabelDisplay = timelineLabel || getTimelineLabelForDisplay(form.projectType, form.timeline) || null;
    const successPayload: LeadSuccessCookiePayload = {
      projectType: form.projectType,
      helpTopics: form.helpTopics,
      helpTopicLabels,
      timeline: form.timeline,
      timelineLabel: timelineLabelDisplay || undefined,
      timestamp: new Date().toISOString(),
    };
    persistLeadSuccessCookie(successPayload);
    setSuccessMeta({
      projectType: form.projectType,
      helpTopicLabels,
      timelineLabel: timelineLabelDisplay,
    });
  };

  const getStepMeta = (stepId: StepId) => {
    switch (stepId) {
      case 'need':
        return {
          title: 'Let’s get you squared away',
          highlightText: 'squared away',
          description: 'We’ll tailor the next few questions so we can route you to the right spot.',
        };
      case 'context':
        return {
          title: 'How can we help?',
          highlightText: 'we help?',
          description: journey?.showHelpMulti
            ? 'We’ll pull together the right team and resources just for you'
            : 'Share what’s going on so we can point you to the best next step.',
        };
      case 'contact':
        return {
          title: 'How can we reach you?',
          highlightText: 'reach you?',
          description: 'We respond within 30 minutes during business hours — faster if it’s an emergency.',
        };
      case 'schedule':
        return {
          title: 'Where are you located?',
          highlightText: 'Where',
          description: 'Confirm the service address and the best time to connect.',
        };
      default:
        return { title: '', description: '', highlightText: null };
    }
  };

  const { title, description, highlightText } = getStepMeta(activeStepId);
  const renderedTitle = renderHighlight(title, highlightText);
  const progressPercent = ((activeStepIndex + 1) / totalSteps) * 100;

  const isInitialRender = !hasMountedRef.current;

  const stepMotionProps = reduceMotion
    ? {
      initial: false,
      animate: { x: 0 },
      exit: { x: 0 },
    }
    : {
      initial: isInitialRender ? false : { x: 40 },
      animate: { x: 0 },
      exit: { x: -30 },
      transition: { duration: 0.3, ease: 'easeOut' as const },
    };

  if (status === 'success' && successMeta) {
    return <LeadFormSuccess successMeta={successMeta} onReset={handleResetSuccess} />;
  }

  return (
    <form ref={formRef} className="pb-24" onSubmit={handleSubmit} noValidate>
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="projectType" value={form.projectType} />
      <input type="hidden" name="helpTopics" value={helpSummary} />
      <input type="hidden" name="timeline" value={form.timeline} />
      <input type="hidden" name="preferredContact" value={form.preferredContact} />
      <input type="hidden" name="bestTime" value={form.bestTime} />
      <input type="hidden" name="notes" value={form.notes} />

      <div className="mx-2 overflow-hidden bg-white border border-blue-100 shadow-md rounded-3xl">
        <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-sky-50 via-white to-amber-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[--brand-blue]">Step {activeStepIndex + 1} of {totalSteps}</p>
              <h3 className="mt-3 mb-4 text-xl font-semibold md:text-3xl text-slate-900">{renderedTitle}</h3>
              <p className="mt-3 text-xs md:text-sm text-slate-600">{description}</p>
            </div>
            <div className="relative aspect-[21/9] h-[54px] w-[158px] mb-4">
              <Image
                src="https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-text.webp"
                alt="sonshine logo, no swoosh"
                width={158}
                height={54}
                className="absolute top-[20px] right-0"
              />
            </div>
          </div>
          <div className="w-full h-2 mt-4 overflow-hidden bg-blue-100 rounded-full">
            <div className="h-full rounded-full bg-[--brand-blue] transition-[width]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="p-6">
          {globalError && (
            <div className="px-4 py-3 mb-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
              {globalError}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeStepId} {...stepMotionProps}>
              {activeStepId === 'need' && (
                <div className="grid gap-4 md:grid-cols-2">
                  {PROJECT_OPTIONS.map((option) => {
                    const { value, label, description, icon: Icon, accent, action } = option;
                    const selectable = action === 'advance' && isJourneyKey(value);
                    const selected = selectable && form.projectType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleProjectOption(option)}
                        className={cn(
                          'group flex h-full flex-col justify-between rounded-3xl border bg-white px-4 py-5 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                          selected
                            ? 'border-[--brand-blue] shadow-[0_10px_25px_rgba(15,76,129,0.12)]'
                            : 'border-slate-200 hover:-translate-y-0.5 hover:shadow-lg'
                        )}
                        aria-pressed={selectable ? selected : undefined}
                      >
                        <div>
                          <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', accent)}>
                            <Icon className="w-4 h-4" aria-hidden="true" />
                            {selectable ? (selected ? 'Selected' : 'Tap to select') : 'Opens a new page'}
                          </div>
                          <h4 className="mt-4 font-semibold text-md md:text-xl text-slate-900">{label}</h4>
                          <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                            <p className="text-xs md:text-md text-slate-500">{description}</p>
                            <ArrowRight className="w-4 h-4 transition text-slate-400 group-hover:translate-x-1" aria-hidden="true" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {errors.projectType && (
                    <p className="text-sm font-medium text-red-600 md:col-span-2">{errors.projectType}</p>
                  )}
                </div>
              )}

              {activeStepId === 'context' && (
                <div className="py-2 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    {!journey && (
                      <p className="px-4 py-3 text-sm border rounded-xl border-amber-200 bg-amber-50 text-amber-700">
                        Pick an option to get started above and we&rsquo;ll guide you from there.
                      </p>
                    )}

                    {journey?.showHelpMulti && (
                      <div>
                        <div className="flex-col items-baseline justify-start">
                          <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-600">What&rsquo;s the situation?</h4>
                          <p className="mt-2 mb-1 text-xs font-medium text-slate-500">Select all that apply</p>
                        </div>
                        <div className="grid gap-3 mt-3 md:grid-cols-2">
                          {journey.helpOptions.map(({ value, label, description, icon: Icon }) => {
                            const selected = form.helpTopics.includes(value);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleHelpToggle(value)}
                                className={cn(
                                  HELP_BUTTON_BASE_CLASS,
                                  selected ? HELP_BUTTON_SELECTED_CLASS : HELP_BUTTON_UNSELECTED_CLASS
                                )}
                                aria-pressed={selected}
                              >
                                <div className="flex justify-between">
                                  <div className="inline-flex flex-wrap">
                                    <Icon className={cn('h-6 w-6 mr-3 shrink-0', selected ? 'text-[--brand-blue]' : 'text-slate-400')} aria-hidden="true" />
                                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                                    <p className="mt-1 text-xs ml-9 text-slate-500">{description}</p>
                                  </div>
                                  <div className="">
                                    <Check className={cn("h-5 w-5 ml-6 mr-1", selected ? "text-[--brand-blue]" : "text-white")} />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {errors.helpTopics && <p className="mt-2 text-sm font-medium text-red-600">{errors.helpTopics}</p>}
                      </div>
                    )}

                    {journey?.showTimeline && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-500">Timeline</h4>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {journey.timelineOptions.map(({ value, label }) => {
                            const selected = form.timeline === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleTimelineSelect(value)}
                                className={cn(
                                  SELECTION_PILL_BASE_CLASS,
                                  selected ? SELECTION_PILL_SELECTED_CLASS : SELECTION_PILL_UNSELECTED_CLASS,
                                  !selected && 'hover:text-slate-900'
                                )}
                                aria-pressed={selected}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {errors.timeline && <p className="mt-2 text-sm font-medium text-red-600">{errors.timeline}</p>}
                      </div>
                    )}

                    {journey?.showNotes && (
                      <div className="mt-4">
                        <label htmlFor="notes" className="text-sm font-semibold text-slate-700">
                          {journey.notesLabel}
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          rows={journey.requireNotes ? 5 : 3}
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-900 shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/30"
                          placeholder={journey.notesPlaceholder}
                          value={form.notes}
                          onChange={(event) => onSelect('notes', event.target.value)}
                        />
                        {errors.notes && journey.requireNotes && (
                          <p className="mt-2 text-sm font-medium text-red-600">{errors.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <aside className="flex flex-col gap-4 px-4 py-4 text-sm border border-blue-100 h-fit rounded-2xl bg-blue-50/60 text-slate-600">
                    <div className="flex items-start gap-3">
                      <CalendarClock className="mt-1 h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-slate-800">Need help now?</p>
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
                    <div className="p-4 hidden md:flex h-[250px] w-[256px]">
                      <Image
                        src="https://next.sonshineroofing.com/wp-content/uploads/cropped-runningman-update-e1751376711567.webp"
                        alt="sonshine roofing running man"
                        width={250}
                        height={256}
                      />
                    </div>
                  </aside>
                </div>
              )}

              {activeStepId === 'contact' && (
                <div className="grid gap-4 py-2 md:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-slate-700">
                    First name*
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) => onSelect('firstName', event.target.value)}
                      className={cn(
                        INPUT_BASE_CLASS,
                        errors.firstName ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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
                        INPUT_BASE_CLASS,
                        errors.lastName ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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
                        INPUT_BASE_CLASS,
                        errors.email ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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
                      onChange={(event) => onSelect('phone', sanitizePhoneInput(event.target.value))}
                      className={cn(
                        INPUT_BASE_CLASS,
                        errors.phone ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
                      )}
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <span className="mt-1 text-xs text-red-600">{errors.phone}</span>}
                    <p className="mt-1 text-xs text-slate-500">
                      Digits only, US numbers. Example: {formatPhoneExample(form.phone)}
                    </p>
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">Preferred contact method</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {CONTACT_PREF_OPTIONS.map(({ value, label, icon: Icon }) => {
                        const selected = form.preferredContact === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onSelect('preferredContact', value)}
                            className={cn(
                              'inline-flex items-center gap-2',
                              SELECTION_PILL_BASE_CLASS,
                              selected ? SELECTION_PILL_SELECTED_CLASS : SELECTION_PILL_UNSELECTED_CLASS
                            )}
                            aria-pressed={selected}
                          >
                            <Icon className="w-4 h-4" aria-hidden="true" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeStepId === 'schedule' && (
                <div className="grid gap-4 py-2 md:grid-cols-2">
                  <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                    Street address*
                    <input
                      type="text"
                      name="address1"
                      autoComplete="street-address"
                      value={form.address1}
                      onChange={(event) => onSelect('address1', event.target.value)}
                      className={cn(
                        INPUT_BASE_CLASS,
                        errors.address1 ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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
                      className={cn(INPUT_BASE_CLASS, INPUT_DEFAULT_CLASS)}
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
                        INPUT_BASE_CLASS,
                        errors.city ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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
                      onChange={(event) => onSelect('state', normalizeState(event.target.value))}
                      className={cn(
                        INPUT_BASE_CLASS,
                        'uppercase',
                        errors.state ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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
                      onChange={(event) => onSelect('zip', normalizeZip(event.target.value))}
                      className={cn(
                        INPUT_BASE_CLASS,
                        errors.zip ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
                      )}
                      aria-invalid={Boolean(errors.zip)}
                    />
                    {errors.zip && <span className="mt-1 text-xs text-red-600">{errors.zip}</span>}
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">When should we connect?</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {BEST_TIME_OPTIONS.map(({ value, label }) => {
                        const selected = form.bestTime === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onSelect('bestTime', value)}
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
                    {errors.bestTime && <p className="mt-2 text-sm font-medium text-red-600">{errors.bestTime}</p>}
                  </div>

                  <label className="flex items-center gap-3 px-4 py-3 text-xs border md:col-span-2 rounded-2xl border-slate-200 bg-slate-50 text-slate-600">
                    <input
                      type="checkbox"
                      name="consentSms"
                      checked={form.consentSms}
                      onChange={(event) => onSelect('consentSms', event.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[--brand-blue] focus:ring-[--brand-blue]"
                    />
                    <span>
                      <div className="text-xs text-slate-500">
                        By submitting this form, you agree to receive transactional and promotional
                        communications from Sonshine Roofing. Message frequency may vary. Message and
                        data rates may apply. Reply STOP to opt out at any time.
                      </div>
                    </span>
                  </label>

                  <p className="text-xs md:col-span-2 text-slate-500">
                    For more information,{' '}
                    <SmartLink href="/privacy-policy" className="font-semibold text-[--brand-blue] hover:underline">
                      view our privacy policy
                      <ArrowUpRight className="inline w-3 h-3 ml-1" />
                    </SmartLink>
                  </p>

                  <div className="md:col-span-2">
                    <Turnstile className="pt-1" action="lead-form" />
                    {errors.cfToken && <p className="mt-2 text-sm font-medium text-red-600">{errors.cfToken}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4 border-t border-blue-50 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className={INFO_BADGE_CLASS}>
              <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
              Trusted locally since 1987
            </span>
            <span className={INFO_BADGE_CLASS}>
              <UserRound className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
              Roof advisors, not call center scripts
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mx-8 my-6">
          {activeStepIndex > 0 && (
            <Button type="button" data-icon-affordance="left" variant="secondary" size="sm" onClick={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4 icon-affordance" aria-hidden="true" />
              Back
            </Button>
          )}
          {activeStepIndex < totalSteps - 1 && (
            <Button type="button" data-icon-affordance="right" variant="brandBlue" size="sm" onClick={handleNext} className="gap-2">
              Continue
              <ArrowRight className="w-4 h-4 icon-affordance" aria-hidden="true" />
            </Button>
          )}
          {activeStepIndex === totalSteps - 1 && (
            <Button type="submit" variant="brandOrange" size="sm" disabled={status === 'submitting'} className="gap-2">
              {status === 'submitting' ? 'Sending…' : 'Submit my request'}
              {status !== 'submitting' && <Check className="w-4 h-4" aria-hidden="true" />}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
