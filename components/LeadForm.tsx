'use client';

import { FormEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock4,
  ClipboardList,
  Droplets,
  Hammer,
  HandCoins,
  MessageCircle,
  Phone,
  ShieldCheck,
  Send,
  Star,
  Sparkles,
  SunDim,
  TrendingUp,
  UserRound,
  ExternalLink,
  Wrench,
  ArrowUpRight,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import Turnstile from '@/components/Turnstile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import SmartLink from './SmartLink';

type LeadApiResponse = {
  ok?: boolean;
  error?: string;
};

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

type LeadSuccessRestore = {
  formPreset: Partial<FormState>;
  meta: SuccessMeta;
};

type JourneyKey = 'repair' | 'retail' | 'maintenance' | 'something-else';

type ProjectOption = {
  value: JourneyKey | 'financing-link' | 'project-gallery';
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  action: 'advance' | 'link';
  href?: string;
};

type HelpOption = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type TimelineOption = {
  value: string;
  label: string;
};

type JourneyConfig = {
  helpOptions: HelpOption[];
  timelineOptions: TimelineOption[];
  showHelpMulti: boolean;
  showTimeline: boolean;
  showNotes: boolean;
  requireNotes: boolean;
  notesLabel: string;
  notesPlaceholder: string;
};

type ResourceLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

type ResourceLinkPayload = Pick<ResourceLink, 'label' | 'description' | 'href' | 'external'>;

const PROJECT_OPTIONS: ProjectOption[] = [
  {
    value: 'repair',
    label: 'Emergency leak help',
    description: 'Water coming in or ceiling damage right now',
    icon: Droplets,
    accent: 'border-rose-200 bg-rose-50 text-rose-600',
    action: 'advance',
  },
  {
    value: 'retail',
    label: 'Plan a roof replacement',
    description: 'Ready to compare options for a new roofing system',
    icon: Hammer,
    accent: 'border-amber-200 bg-amber-50 text-amber-600',
    action: 'advance',
  },
  {
    value: 'maintenance',
    label: 'Light repairs, inspections, maintenance',
    description: 'Annual checkups, prepare for hurricane season, real estate',
    icon: Wrench,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    action: 'advance',
  },
  {
    value: 'financing-link',
    label: 'Browse financing options',
    description: 'Payment deferrals, low APR, fast approval',
    icon: HandCoins,
    accent: 'border-sky-200 bg-sky-50 text-sky-600',
    action: 'link',
    href: '/financing#get-started',
  },
  {
    value: 'project-gallery',
    label: 'See our past work',
    description: 'Browse our project gallery, learn more about material and color options',
    icon: Star,
    accent: 'border-purple-200 bg-purple-50 text-purple-600',
    action: 'link',
    href: '/project',
  },
  {
    value: 'something-else',
    label: 'Something else',
    description: 'Warranty, insurance, skylights, or just have a few questions',
    icon: MessageCircle,
    accent: 'border-violet-200 bg-violet-50 text-violet-600',
    action: 'advance',
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

const EMERGENCY_REPLACEMENT_HELP: HelpOption[] = [
  {
    value: 'active-leak',
    label: 'I have an active leak',
    description: 'There is water inside or the interior is compromised',
    icon: Droplets,
  },
  {
    value: 'aging-out',
    label: 'Roof is aging out',
    description: 'It’s close to the end of its lifespan and we want a plan',
    icon: SunDim,
  },
  {
    value: 'just-researching',
    label: 'Researching options',
    description: 'Gathering ideas, timelines, and investment ranges',
    icon: TrendingUp,
  },
  {
    value: 'visible-damage',
    label: 'I can see roof damage',
    description: 'Missing shingles, lifted tiles, or debris on the roof',
    icon: AlertTriangle,
  },
  {
    value: 'inspection-needed',
    label: 'Need an inspection report',
    description: 'For insurance, warranty, or peace of mind before hurricane season',
    icon: ShieldCheck,
  },
  {
    value: 'financing-options',
    label: 'I am interested in my financing options',
    description: 'No credit check, personalized quiz, detailed monthly payment calculator',
    icon: HandCoins,
  },
];

const MAINTENANCE_HELP: HelpOption[] = [
  {
    value: 'inspection-needed',
    label: 'Need an inspection report',
    description: 'For insurance, warranty, or peace of mind before hurricane season',
    icon: ClipboardList,
  },
  {
    value: 'visible-damage',
    label: 'I can see roof damage',
    description: 'Missing shingles, lifted tiles, or debris on the roof',
    icon: AlertTriangle,
  },
  {
    value: 'roof-care-club',
    label: 'I want to join the Roof Care Club',
    description: 'Yearly maintenance plan, documentation for insurance',
    icon: Sparkles,
  },
];

const JOURNEY_CONFIG: Record<JourneyKey, JourneyConfig> = {
  'repair': {
    helpOptions: EMERGENCY_REPLACEMENT_HELP,
    timelineOptions: STANDARD_TIMELINE_OPTIONS,
    showHelpMulti: true,
    showTimeline: true,
    showNotes: true,
    requireNotes: false,
    notesLabel: 'Anything else you’d like us to know?',
    notesPlaceholder: 'Example: We already have tarps down, or insurance adjuster scheduled Friday.',
  },
  retail: {
    helpOptions: EMERGENCY_REPLACEMENT_HELP,
    timelineOptions: STANDARD_TIMELINE_OPTIONS,
    showHelpMulti: true,
    showTimeline: true,
    showNotes: true,
    requireNotes: false,
    notesLabel: 'Anything else you’d like us to know?',
    notesPlaceholder: 'Share anything that will help us prep for your project.',
  },
  maintenance: {
    helpOptions: MAINTENANCE_HELP,
    timelineOptions: STANDARD_TIMELINE_OPTIONS,
    showHelpMulti: true,
    showTimeline: true,
    showNotes: true,
    requireNotes: false,
    notesLabel: 'Anything else you’d like us to know?',
    notesPlaceholder: 'Tell us about your maintenance goals or existing issues.',
  },
  'something-else': {
    helpOptions: [],
    timelineOptions: [],
    showHelpMulti: false,
    showTimeline: false,
    showNotes: true,
    requireNotes: true,
    notesLabel: 'Explain your situation',
    notesPlaceholder: 'Use as much detail as you’d like.',
  },
};

const JOURNEY_RESOURCES: Partial<Record<JourneyKey, ResourceLink[]>> = {
  'repair': [
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

const CONTACT_PREF_OPTIONS = [
  { value: 'phone-call', label: 'Phone call', icon: Phone },
  { value: 'email', label: 'Email', icon: Send },
] as const;

const BEST_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (8–11am)' },
  { value: 'midday', label: 'Midday (11–2pm)' },
  { value: 'afternoon', label: 'Afternoon (2–5pm)' },
  { value: 'no-preference', label: 'No preference' },
] as const;

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

const SUCCESS_LINK_CARD_CLASS =
  'group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[--brand-blue] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]';
const SUCCESS_LINK_ICON_WRAPPER_CLASS =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--brand-blue]/10 text-[--brand-blue]';

const INFO_BADGE_CLASS = 'inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1';

function isJourneyKey(value: string | null | undefined): value is JourneyKey {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(JOURNEY_CONFIG, value);
}

function getJourneyConfig(projectType: string | null | undefined): JourneyConfig | null {
  if (!isJourneyKey(projectType)) return null;
  return JOURNEY_CONFIG[projectType];
}

function getSuccessLinks(projectType: string): ResourceLink[] {
  if (!isJourneyKey(projectType)) return UNIVERSAL_RESOURCES;
  const specific = JOURNEY_RESOURCES[projectType] ?? [];
  return [...specific, ...UNIVERSAL_RESOURCES];
}

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
  preferredContact: string;
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
  preferredContact: 'phone-call',
  bestTime: '',
  consentSms: false,
};

interface FieldErrors {
  [key: string]: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

function formatPhoneExample(phone: string): string {
  const digits = sanitizePhoneInput(phone || '9415551234');
  if (digits.length < 10) return '(941) 555-1234';
  const area = digits.slice(0, 3);
  const mid = digits.slice(3, 6);
  const last = digits.slice(6, 10);
  return `(${area}) ${mid}-${last}`;
}

function formatFallbackLabel(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getHelpTopicLabelsForDisplay(projectType: string, helpTopics: string[]): string[] {
  if (!helpTopics.length) return [];
  const journey = getJourneyConfig(projectType);
  if (!journey) return helpTopics.map((topic) => formatFallbackLabel(topic));
  const lookup = new Map(journey.helpOptions.map((option) => [option.value, option.label]));
  return helpTopics.map((topic) => lookup.get(topic) ?? formatFallbackLabel(topic));
}

function getTimelineLabelForDisplay(projectType: string, timeline: string): string | null {
  if (!timeline) return null;
  const journey = getJourneyConfig(projectType);
  const option = journey?.timelineOptions.find((item) => item.value === timeline);
  if (option) return option.label;
  return formatFallbackLabel(timeline) || null;
}

function restoreLeadSuccessState(rawCookie?: string | null): LeadSuccessRestore | null {
  const parsed = parseLeadSuccessCookie(rawCookie);
  if (!parsed) return null;

  const projectType = parsed.projectType || '';
  if (!projectType) return null;

  const helpTopics = Array.isArray(parsed.helpTopics)
    ? parsed.helpTopics.filter((topic): topic is string => typeof topic === 'string')
    : [];
  const timeline = typeof parsed.timeline === 'string' ? parsed.timeline : '';

  const helpTopicLabels = Array.isArray(parsed.helpTopicLabels) && parsed.helpTopicLabels.every((label) => typeof label === 'string')
    ? (parsed.helpTopicLabels as string[])
    : getHelpTopicLabelsForDisplay(projectType, helpTopics);
  const timelineLabel = typeof parsed.timelineLabel === 'string' && parsed.timelineLabel
    ? parsed.timelineLabel
    : getTimelineLabelForDisplay(projectType, timeline);

  return {
    formPreset: {
      projectType,
      helpTopics,
      timeline,
    },
    meta: {
      projectType,
      helpTopicLabels,
      timelineLabel: timelineLabel || null,
    },
  };
}

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

export default function LeadForm({ initialSuccessCookie }: { initialSuccessCookie?: string | null } = {}) {
  const router = useRouter();
  const restoredSuccess = useMemo(() => restoreLeadSuccessState(initialSuccessCookie), [initialSuccessCookie]);
  const [form, dispatch] = useReducer(
    formReducer,
    INITIAL_STATE,
    (initial) => (restoredSuccess ? { ...initial, ...restoredSuccess.formPreset } : initial)
  );
  const [activeStepIndex, setActiveStepIndex] = useState(restoredSuccess ? STEP_ORDER.length - 1 : 0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>(restoredSuccess ? 'success' : 'idle');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const searchParams = useSearchParams();
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

  const utm = useMemo(() => {
    const source = searchParams?.get('utm_source') || undefined;
    const medium = searchParams?.get('utm_medium') || undefined;
    const campaign = searchParams?.get('utm_campaign') || undefined;
    return { source, medium, campaign };
  }, [searchParams]);

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
    const contextSummaryParts: string[] = [];
    if (notesText) contextSummaryParts.push(`Note from the customer: ${notesText}.`);
    if (bestTimeLabel) contextSummaryParts.push(`Best time to contact: ${bestTimeLabel}.`);
    if (timelineLabel) contextSummaryParts.push(`Project timeline: ${timelineLabel}.`);
    const contextSummary = contextSummaryParts.join(' ');

    const resourceLinksForPayload: ResourceLinkPayload[] = getSuccessLinks(form.projectType).map(
      ({ label, description, href, external }) => ({
        label,
        description,
        href,
        external,
      })
    );

    const payload: Record<string, unknown> = {
      type: 'contact-lead',
      projectType: form.projectType,
      helpTopics: helpSummary || undefined,
      timeline: timelineLabel || undefined,
      notes: notesText || undefined,
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
      bestTime: bestTimeLabel || undefined,
      consentSms: form.consentSms,
      cfToken,
      hp_field: honeypot,
      page: '/contact-us',
      submittedAt: new Date().toISOString(),
    };

    if (contextSummary) payload.contextSummary = contextSummary;
    if (resourceLinksForPayload.length) payload.resourceLinks = resourceLinksForPayload;

    if (utm.source) payload.utm_source = utm.source;
    if (utm.medium) payload.utm_medium = utm.medium;
    if (utm.campaign) payload.utm_campaign = utm.campaign;

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let json: LeadApiResponse = {};
      try {
        json = (await res.json()) as LeadApiResponse;
      } catch {
        json = {};
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Unable to send your request.');
      }
      setStatus('success');
      setErrors({});
      writeCookie(CONTACT_READY_COOKIE, '1', CONTACT_READY_MAX_AGE);
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
      try {
        const win = window as DataLayerWindow;
        win.dataLayer = win.dataLayer || [];
        win.dataLayer.push({
          event: 'lead_form_submitted',
          projectType: form.projectType,
          helpTopics: helpSummary,
        });
      } catch {
        // swallow GTM errors
      }
    } catch (error: unknown) {
      console.error('Lead submission failed', error);
      setStatus('error');
      const message = error instanceof Error ? error.message : null;
      setGlobalError(message || 'We could not send your message. Please call us at (941) 866-4320.');
    }
  };

  const getStepMeta = (stepId: StepId) => {
    switch (stepId) {
      case 'need':
        return {
          title: 'Let’s get you squared away',
          description: 'We’ll tailor the next few questions so we can route you to the right spot.',
        };
      case 'context':
        return {
          title: 'How can we help?',
          description: journey?.showHelpMulti
            ? 'We’ll pull together the right team and resources just for you'
            : 'Share what’s going on so we can point you to the best next step.',
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

  if (status === 'success') {
    const successLinks = getSuccessLinks(form.projectType);
    return (
      <div className="mt-8 flex justify-center px-4">
        <div className="w-full max-w-3xl rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-md">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
            <h3 className="mt-4 text-3xl md:4xl font-semibold text-slate-900">We’ve got it — thank you!</h3>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              Your message is already on the way to our project support team. We’ll reach out shortly with next steps.
              If a storm is moving in or water is coming inside, call us right now at{' '}
              <a className="font-semibold text-[--brand-blue]" href="tel:+19418664320">(941) 866-4320</a>.
            </p>
            {(successMeta?.helpTopicLabels.length || successMeta?.timelineLabel) && (
              <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">What you shared</h4>
                {successMeta?.timelineLabel && (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Timeline:</span> {successMeta.timelineLabel}
                  </p>
                )}
                {successMeta?.helpTopicLabels.length ? (
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
    <form ref={formRef} className="md:pt-8 pb-24" onSubmit={handleSubmit} noValidate>
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="projectType" value={form.projectType} />
      <input type="hidden" name="helpTopics" value={helpSummary} />
      <input type="hidden" name="timeline" value={form.timeline} />
      <input type="hidden" name="preferredContact" value={form.preferredContact} />
      <input type="hidden" name="bestTime" value={form.bestTime} />
      <input type="hidden" name="notes" value={form.notes} />

      <div id="get-started" className="overflow-hidden mx-2 rounded-3xl border border-blue-100 bg-white shadow-md">
        <div className="border-b border-blue-100 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[--brand-blue]">Step {activeStepIndex + 1} of {totalSteps}</p>
              <h3 className="mt-3 mb-4 text-xl md:text-3xl font-semibold text-slate-900">{title}</h3>
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
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-[--brand-blue] transition-[width]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="p-6">
          {globalError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {selectable ? (selected ? 'Selected' : 'Tap to select') : 'Opens a new page'}
                          </div>
                          <h4 className="mt-4 text-md md:text-xl font-semibold text-slate-900">{label}</h4>
                          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                            <p className="text-xs md:text-md text-slate-500">{description}</p>
                            <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" aria-hidden="true" />
                          </div>
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
                <div className="py-2 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-4">
                    {!journey && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Pick an option to get started above and we&rsquo;ll guide you from there.
                      </p>
                    )}

                    {journey?.showHelpMulti && (
                      <div>
                        <div className="flex-col items-baseline justify-start">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">What&rsquo;s the situation?</h4>
                          <p className="text-xs mt-2 mb-1 font-medium text-slate-500">Select all that apply</p>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                                    <p className="mt-1 ml-9 text-xs text-slate-500">{description}</p>
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
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timeline</h4>
                        <div className="mt-3 flex flex-wrap gap-2">
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
                      <div>
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
                  <aside className="flex flex-col h-fit gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-sm text-slate-600">
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
                <div className="py-2 grid gap-4 md:grid-cols-2">
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
                      onChange={(event) => onSelect('phone', event.target.value)}
                      className={cn(
                        INPUT_BASE_CLASS,
                        errors.phone ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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
                              'inline-flex items-center gap-2',
                              SELECTION_PILL_BASE_CLASS,
                              selected ? SELECTION_PILL_SELECTED_CLASS : SELECTION_PILL_UNSELECTED_CLASS
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
                <div className="py-2 grid gap-4 md:grid-cols-2">
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
                      onChange={(event) => onSelect('state', event.target.value.toUpperCase().slice(0, 2))}
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
                      onChange={(event) => onSelect('zip', event.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      className={cn(
                        INPUT_BASE_CLASS,
                        errors.zip ? INPUT_ERROR_CLASS : INPUT_DEFAULT_CLASS
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

                  <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      name="consentSms"
                      checked={form.consentSms}
                      onChange={(event) => onSelect('consentSms', event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[--brand-blue] focus:ring-[--brand-blue]"
                    />
                    <span>
                      <div className="text-xs text-slate-500">
                        By submitting this form, you agree to receive transactional and promotional
                        communications from Sonshine Roofing. Message frequency may vary. Message and
                        data rates may apply. Reply STOP to opt out at any time.
                      </div>
                    </span>
                  </label>

                  <p className="md:col-span-2 text-xs text-slate-500">
                    For more information,{' '}
                    <SmartLink href="/privacy-policy" className="font-semibold text-[--brand-blue] hover:underline">
                      view our privacy policy
                      <ArrowUpRight className="h-3 w-3 ml-1 inline" />
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

        <div className="flex flex-col gap-4 border-t border-blue-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
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
        <div className="flex justify-end gap-3 mx-8 my-6 items-center">
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
    </form>
  );
}
