// Financing lead magnet with gated calculator
'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Check, HelpCircle, ArrowRight, Undo2, SearchCheck, LockKeyholeOpen, ArrowDown, UserRoundPen, Forward, Calculator, DollarSign, ChartBar, ChevronRight } from 'lucide-react';
import Turnstile from '@/components/Turnstile';
import { FINANCING_PRESETS, FINANCING_PROGRAMS, monthlyPayment } from '@/lib/financing-programs';

const COOKIE_NAME = 'ss_financing_calc';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const EMAIL_DOMAINS = ['.com', '.net', '.org', '.edu', '.gov', '.co', '.us', '.io', '.info', '.biz'];

const US_STATES = [
  { value: '', label: 'Select state' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

type FinancingProgramKey = 'ygrene' | 'serviceFinance';

type ScoreWeights = Record<FinancingProgramKey, number>;

type QuizOption = {
  value: string;
  label: string;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

export type FinancingScores = {
  ygreneScore: number;
  serviceFinanceScore: number;
  isUncertain: boolean;
};

const MAX_SCORE = 27;

const quizQuestions: QuizQuestion[] = [
  {
    id: 'priority',
    prompt: "What’s your biggest priority?",
    options: [
      { value: 'low-monthly-payments', label: 'Low monthly payments' },
      { value: 'fast-approval', label: 'Fast approval' },
      { value: 'no-property-lien', label: 'No property lien' },
      { value: 'low-upfront-costs', label: 'Low upfront costs' },
      { value: 'not-sure', label: 'I’m not sure yet' },
    ],
  },
  {
    id: 'equity',
    prompt: 'Do you have home equity and a clean property tax record?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not-sure', label: 'I’m not sure' },
    ],
  },
  {
    id: 'payment-delay',
    prompt: 'Would you prefer a delay of 12–24 months before your first payment?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not-important', label: 'Not important' },
    ],
  },
  {
    id: 'credit-score',
    prompt: 'Roughly what’s your credit score?',
    options: [
      { value: '700-plus', label: '700+' },
      { value: '650-699', label: '650–699' },
      { value: 'under-650', label: 'Under 650' },
      { value: 'not-sure', label: 'Not sure' },
    ],
  },
  {
    id: 'income-verification',
    prompt: 'Can you verify income and employment if needed?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'loan-structure',
    prompt: 'Which of these loan structures feels more comfortable to you?',
    options: [
      {
        value: 'credit-based',
        label: 'Credit-based (uses credit score + income verification)',
      },
      {
        value: 'tax-based',
        label: 'Tax-based (repaid via your property tax bill; a lien is placed if unpaid)',
      },
      { value: 'either', label: 'I’m okay with either' },
      { value: 'not-sure', label: 'I’m not sure' },
    ],
  },
  {
    id: 'tax-assessment',
    prompt: 'Are you comfortable adding an assessment to your property tax bill?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not-sure', label: 'Not sure' },
    ],
  },
  {
    id: 'sell-timeline',
    prompt: 'Are you planning to sell your home in the next 5 years?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'maybe', label: 'Maybe' },
    ],
  },
  {
    id: 'project-timeline',
    prompt: 'How quickly are you hoping to get this roof done?',
    options: [
      { value: 'asap', label: 'ASAP (within 1–2 weeks)' },
      { value: '1-3-months', label: '1–3 months' },
      { value: '3-6-months', label: '3–6 months' },
      { value: '6-12-months', label: '6–12 months' },
      { value: 'researching', label: 'I’m just researching' },
    ],
  },
];

const QUESTION_ORDER = quizQuestions.map((question) => question.id);

const SCORING_MATRIX: Record<string, Record<string, ScoreWeights>> = {
  priority: {
    'low-monthly-payments': { ygrene: 3, serviceFinance: 2 },
    'fast-approval': { ygrene: 3, serviceFinance: 2 },
    'no-property-lien': { ygrene: 0, serviceFinance: 3 },
    'low-upfront-costs': { ygrene: 2, serviceFinance: 2 },
    'not-sure': { ygrene: 1, serviceFinance: 1 },
  },
  equity: {
    yes: { ygrene: 3, serviceFinance: 1 },
    no: { ygrene: 0, serviceFinance: 2 },
    'not-sure': { ygrene: 1, serviceFinance: 1 },
  },
  'payment-delay': {
    yes: { ygrene: 1, serviceFinance: 3 },
    no: { ygrene: 3, serviceFinance: 1 },
    'not-important': { ygrene: 2, serviceFinance: 2 },
  },
  'credit-score': {
    '700-plus': { ygrene: 1, serviceFinance: 3 },
    '650-699': { ygrene: 1, serviceFinance: 2 },
    'under-650': { ygrene: 3, serviceFinance: 0 },
    'not-sure': { ygrene: 2, serviceFinance: 1 },
  },
  'income-verification': {
    yes: { ygrene: 1, serviceFinance: 3 },
    no: { ygrene: 3, serviceFinance: 0 },
    'prefer-not-to-say': { ygrene: 2, serviceFinance: 1 },
  },
  'loan-structure': {
    'credit-based': { ygrene: 0, serviceFinance: 3 },
    'tax-based': { ygrene: 3, serviceFinance: 0 },
    either: { ygrene: 2, serviceFinance: 2 },
    'not-sure': { ygrene: 1, serviceFinance: 1 },
  },
  'tax-assessment': {
    yes: { ygrene: 3, serviceFinance: 0 },
    no: { ygrene: 0, serviceFinance: 3 },
    'not-sure': { ygrene: 1, serviceFinance: 1 },
  },
  'sell-timeline': {
    yes: { ygrene: 1, serviceFinance: 3 },
    no: { ygrene: 3, serviceFinance: 2 },
    maybe: { ygrene: 2, serviceFinance: 2 },
  },
  'project-timeline': {
    asap: { ygrene: 2, serviceFinance: 3 },
    '1-3-months': { ygrene: 2, serviceFinance: 2 },
    '3-6-months': { ygrene: 2, serviceFinance: 2 },
    '6-12-months': { ygrene: 2, serviceFinance: 2 },
    researching: { ygrene: 1, serviceFinance: 1 },
  },
};

export function calculateFinancingScores(userAnswers: string[]): FinancingScores {
  const totals: Record<FinancingProgramKey, number> = { ygrene: 0, serviceFinance: 0 };

  userAnswers.forEach((answer, index) => {
    const questionId = QUESTION_ORDER[index];
    if (!questionId) return;
    const weights = SCORING_MATRIX[questionId]?.[answer];
    if (!weights) return;
    totals.ygrene += weights.ygrene ?? 0;
    totals.serviceFinance += weights.serviceFinance ?? 0;
  });

  const normalize = (value: number) => Math.min(100, Math.round((value / MAX_SCORE) * 100));
  const ygreneScore = normalize(totals.ygrene);
  const serviceFinanceScore = normalize(totals.serviceFinance);

  return {
    ygreneScore,
    serviceFinanceScore,
    isUncertain: ygreneScore < 50 && serviceFinanceScore < 50,
  };
}

const MATCH_PROGRAMS: Record<FinancingProgramKey, { label: string; programIds: string[]; description: string }> = {
  serviceFinance: {
    label: 'Service Finance',
    programIds: ['same-as-cash-12', 'term-10yr-999', 'term-15yr-79'],
    description: 'Traditional loan with fixed payments and no property tax lien.',
  },
  ygrene: {
    label: 'YGrene PACE',
    programIds: ['ygrene-15yr-849'],
    description: 'PACE financing that leverages property equity with deferred payments.',
  },
};

const PROGRAM_DETAIL_ANCHORS: Record<FinancingProgramKey, string> = {
  serviceFinance: '#service-finance-program-card',
  ygrene: '#ygrene-program-card',
};

// ============ STYLE CONSTANTS ====================== //
const pillBase = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-tight shadow-sm';
const infoPillClass = `${pillBase} text-slate-400`;
const successPillClass = `${pillBase} bg-emerald-500 text-white`;
const gradientShell = 'rounded-3xl bg-gradient-to-r from-[--brand-blue] to-[--brand-cyan] p-[1.5px] shadow-xl shadow-[rgba(0,69,215,0.12)]';
const innerPanel = 'rounded-3xl bg-white overflow-hidden';
const stepCardClass = 'space-y-4 rounded-2xl border border-blue-200 bg-white/85 p-5 shadow-sm backdrop-blur';
const inputBaseClass = 'mt-1 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20';

type FormValues = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  amount: string;
  email: string;
  phone: string; // digits only
};

type SubmissionState = 'idle' | 'submitting' | 'error';

type FinancingCookie = {
  unlocked: boolean;
  amount?: number;
  scores?: FinancingScores;
};

function currency(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function sanitizeAmountInput(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 7);
}

function sanitizePhoneInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatPhoneDisplay(digits: string) {
  const cleaned = sanitizePhoneInput(digits);
  if (!cleaned) return '';
  const hasCountryCode = cleaned.length === 11;
  const country = hasCountryCode ? cleaned[0] : '';
  const core = hasCountryCode ? cleaned.slice(1) : cleaned;
  const area = core.slice(0, 3);
  const mid = core.slice(3, 6);
  const last = core.slice(6, 10);

  if (core.length <= 3) {
    return `${hasCountryCode ? `+${country} ` : ''}(${area}`;
  }
  if (core.length <= 6) {
    return `${hasCountryCode ? `+${country} ` : ''}(${area}) ${mid}`;
  }
  return `${hasCountryCode ? `+${country} ` : ''}(${area}) ${mid}-${last}`;
}

function isEmailValid(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  if (!basic) return false;
  return EMAIL_DOMAINS.some((suffix) => trimmed.endsWith(suffix));
}

function isZipValid(zip: string) {
  const cleaned = zip.replace(/\D/g, '');
  return cleaned.length === 5;
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return parts ? parts.split('=').slice(1).join('=') : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

function parseCookie(raw: string | null): FinancingCookie | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as FinancingCookie;
  } catch {
    return null;
  }
}

export default function MonthlyEstimator({ defaultAmount = 15000 }: { defaultAmount?: number }) {
  const totalQuizQuestions = quizQuestions.length;
  const summaryStepIndex = totalQuizQuestions;
  const firstFormStepIndex = summaryStepIndex + 1;
  const secondFormStepIndex = summaryStepIndex + 2;
  const thirdFormStepIndex = summaryStepIndex + 3;

  const [step, setStep] = useState<number>(0);
  const [submission, setSubmission] = useState<SubmissionState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState(defaultAmount);
  const [submittedAmount, setSubmittedAmount] = useState<number | null>(null);
  const [persistedScores, setPersistedScores] = useState<FinancingScores | null>(null);
  const [customPulse, setCustomPulse] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [contactEditMode, setContactEditMode] = useState(false);
  const confirmTimeoutRef = useRef<number | null>(null);
  const [liveStatus, setLiveStatus] = useState('');
  const [animatedScores, setAnimatedScores] = useState<Record<FinancingProgramKey, number>>({
    serviceFinance: 0,
    ygrene: 0,
  });

  const [formValues, setFormValues] = useState<FormValues>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    amount: String(defaultAmount || ''),
    email: '',
    phone: '',
  });

  useEffect(() => {
    const cookie = parseCookie(readCookie(COOKIE_NAME));
    if (cookie?.unlocked) {
      const amt = Number(cookie.amount) || defaultAmount;
      const roundedAmount = Math.max(1000, Math.round(amt));
      setUnlocked(true);
      setShowCalculator(true);
      setContactEditMode(false);
      setCalculatorAmount(roundedAmount);
      setFormValues((prev) => ({ ...prev, amount: String(roundedAmount) }));
      setSubmittedAmount(roundedAmount);
      setPersistedScores(cookie.scores ?? null);
    }
  }, [defaultAmount]);

  const [quizAnswers, setQuizAnswers] = useState<(string | null)[]>(() => Array(totalQuizQuestions).fill(null));
  const computedScores = useMemo(() => {
    if (quizAnswers.some((answer) => answer == null)) return null;
    return calculateFinancingScores(quizAnswers as string[]);
  }, [quizAnswers]);

  const paymentRows = useMemo(
    () =>
      FINANCING_PROGRAMS.map((program) => ({
        program,
        amount: monthlyPayment(calculatorAmount, program.apr, program.termMonths),
      })),
    [calculatorAmount]
  );

  const amountChips = useMemo(() => {
    const base = new Set<number>(FINANCING_PRESETS);
    if (submittedAmount != null) {
      base.add(Math.round(submittedAmount));
    }
    return Array.from(base).sort((a, b) => a - b);
  }, [submittedAmount]);

  const groupedPayments = useMemo(() => {
    const service = paymentRows.filter(({ program }) => MATCH_PROGRAMS.serviceFinance.programIds.includes(program.id));
    const ygrene = paymentRows.filter(({ program }) => MATCH_PROGRAMS.ygrene.programIds.includes(program.id));
    return { service, ygrene };
  }, [paymentRows]);

  const displayScores = persistedScores ?? computedScores;
  const prefersReducedMotion = useReducedMotion();
  const leadingProgram: FinancingProgramKey | null = displayScores
    ? displayScores.ygreneScore === displayScores.serviceFinanceScore
      ? null
      : displayScores.ygreneScore > displayScores.serviceFinanceScore
        ? 'ygrene'
        : 'serviceFinance'
    : null;

  const allowContactSteps = !unlocked || contactEditMode;
  const effectiveLastStepIndex = allowContactSteps ? thirdFormStepIndex : summaryStepIndex;

  const stepContentRef = useRef<HTMLDivElement | null>(null);
  const scoreAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!customPulse) return;
    const timeout = setTimeout(() => setCustomPulse(false), 800);
    return () => clearTimeout(timeout);
  }, [customPulse]);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current != null) {
        window.clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raf = window.requestAnimationFrame(() => {
      const container = stepContentRef.current;
      if (!container) return;
      const focusable = container.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus({ preventScroll: true });
      } else {
        container.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [step]);

  useEffect(() => {
    if (scoreAnimationFrameRef.current != null) {
      cancelAnimationFrame(scoreAnimationFrameRef.current);
      scoreAnimationFrameRef.current = null;
    }

    if (!displayScores) {
      setAnimatedScores({ serviceFinance: 0, ygrene: 0 });
      return;
    }

    if (!showCalculator) {
      setAnimatedScores({ serviceFinance: 0, ygrene: 0 });
      return;
    }

    const targetScores: Record<FinancingProgramKey, number> = {
      serviceFinance: displayScores.serviceFinanceScore,
      ygrene: displayScores.ygreneScore,
    };

    if (prefersReducedMotion) {
      setAnimatedScores(targetScores);
      return;
    }

    const durationMs = 800;
    const startTime = performance.now();

    setAnimatedScores({ serviceFinance: 0, ygrene: 0 });

    const stepFrame = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const nextScores: Record<FinancingProgramKey, number> = {
        serviceFinance: targetScores.serviceFinance * progress,
        ygrene: targetScores.ygrene * progress,
      };
      setAnimatedScores(nextScores);

      if (progress < 1) {
        scoreAnimationFrameRef.current = requestAnimationFrame(stepFrame);
      } else {
        scoreAnimationFrameRef.current = null;
        setAnimatedScores(targetScores);
      }
    };

    scoreAnimationFrameRef.current = requestAnimationFrame(stepFrame);

    return () => {
      if (scoreAnimationFrameRef.current != null) {
        cancelAnimationFrame(scoreAnimationFrameRef.current);
        scoreAnimationFrameRef.current = null;
      }
    };
  }, [displayScores, showCalculator, prefersReducedMotion]);

  const validateFormStep = (currentStep: number) => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === firstFormStepIndex) {
      if (!formValues.firstName.trim()) nextErrors.firstName = 'Enter your first name';
      if (!formValues.lastName.trim()) nextErrors.lastName = 'Enter your last name';
      const amountDigits = sanitizeAmountInput(formValues.amount);
      const amountNumber = Number(amountDigits);
      if (!amountDigits || Number.isNaN(amountNumber) || amountNumber < 1000) {
        nextErrors.amount = 'Enter a project total of at least $1,000';
      }
    }
    if (currentStep === secondFormStepIndex) {
      if (!formValues.address1.trim()) nextErrors.address1 = 'Enter the property address';
      if (!formValues.city.trim()) nextErrors.city = 'City is required';
      if (!formValues.state.trim()) nextErrors.state = 'Select a state';
      if (!isZipValid(formValues.zip)) nextErrors.zip = 'Enter 5-digit ZIP';
    }
    if (currentStep === thirdFormStepIndex) {
      if (!isEmailValid(formValues.email)) nextErrors.email = 'Enter a valid email (example@domain.com)';
      const phoneDigits = sanitizePhoneInput(formValues.phone);
      if (!(phoneDigits.length === 10 || phoneDigits.length === 11)) {
        nextErrors.phone = 'Enter a valid phone number (10 digits, optional country code)';
      }
    }
    return nextErrors;
  };

  const handleQuizAnswer = (index: number, value: string) => {
    const next = [...quizAnswers];
    next[index] = value;
    setQuizAnswers(next);
    setErrors({});
    setGlobalError(null);
    if (!unlocked) {
      setPersistedScores(null);
    } else if (next.every((answer) => answer != null)) {
      const nextScores = calculateFinancingScores(next as string[]);
      setPersistedScores(nextScores);
      const amountForCookie = submittedAmount ?? calculatorAmount ?? defaultAmount;
      const normalizedAmount = Math.max(1000, Math.round(amountForCookie || defaultAmount));
      const cookiePayload: FinancingCookie = {
        unlocked: true,
        amount: normalizedAmount,
        scores: nextScores,
      };
      writeCookie(COOKIE_NAME, JSON.stringify(cookiePayload), COOKIE_MAX_AGE);
    }
    if (confirmTimeoutRef.current != null) {
      window.clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    setLiveStatus('');
    const question = quizQuestions[index];
    const selectedOption = question.options.find((option) => option.value === value);
    if (selectedOption) {
      setLiveStatus(`Saved "${selectedOption.label}" for question ${index + 1}.`);
    }
    const targetStep = index === totalQuizQuestions - 1 ? summaryStepIndex : index + 1;
    confirmTimeoutRef.current = window.setTimeout(() => {
      setStep(targetStep);
      confirmTimeoutRef.current = null;
    }, 100);
  };

  const handleNext = () => {
    setGlobalError(null);
    setErrors({});

    if (step < totalQuizQuestions) {
      if (quizAnswers[step] == null) {
        setGlobalError('Select an option to continue.');
        return;
      }
      setStep(step + 1);
      return;
    }

    if (step === summaryStepIndex) {
      if (allowContactSteps) {
        setStep(step + 1);
      } else {
        handleShowCalculatorView();
      }
      return;
    }

    const stepErrors = validateFormStep(step);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }

    setStep(Math.min(step + 1, thirdFormStepIndex));
  };

  const handleBack = () => {
    setErrors({});
    setGlobalError(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSelectAmount = (value: number) => {
    setCalculatorAmount(value);
    if (submittedAmount != null && Math.round(submittedAmount) === Math.round(value)) {
      setCustomPulse(false);
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => setCustomPulse(true));
      } else {
        setCustomPulse(true);
      }
    }
  };

  const handleReturnToQuiz = () => {
    if (confirmTimeoutRef.current != null) {
      window.clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    setShowCalculator(false);
    setContactEditMode(false);
    setErrors({});
    setGlobalError(null);
    setLiveStatus('');
    setStep(0);
  };

  const handleShowCalculatorView = () => {
    if (confirmTimeoutRef.current != null) {
      window.clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    if (step > summaryStepIndex) {
      setStep(summaryStepIndex);
    }
    setContactEditMode(false);
    setErrors({});
    setGlobalError(null);
    setLiveStatus('');
    setShowCalculator(true);
  };

  const handleStartContactEdit = () => {
    if (confirmTimeoutRef.current != null) {
      window.clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    setContactEditMode(true);
    setErrors({});
    setGlobalError(null);
    setLiveStatus('');
    setShowCalculator(false);
    setStep(firstFormStepIndex);
  };

  const friendlyError = (raw?: unknown) => {
    if (!raw || typeof raw !== 'string') return 'We could not send your request. Please try again.';
    if (raw.toLowerCase().includes('rating')) return 'We could not send your request just now. Please try again in a moment.';
    return raw;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submission === 'submitting') return;

    if (step < thirdFormStepIndex) {
      handleNext();
      return;
    }

    const finalErrors = validateFormStep(thirdFormStepIndex);
    if (Object.keys(finalErrors).length) {
      setErrors(finalErrors);
      setStep(thirdFormStepIndex);
      return;
    }

    if (quizAnswers.some((answer) => answer === null)) {
      const firstUnanswered = quizAnswers.findIndex((answer) => answer === null);
      setGlobalError('Please answer each quick question.');
      setStep(firstUnanswered === -1 ? 0 : firstUnanswered);
      return;
    }

    const form = event.currentTarget;
    const fd = new FormData(form);
    const cfToken = String(fd.get('cfToken') || '');
    const honeypot = String(fd.get('company') || '');

    if (!cfToken) {
      setErrors({});
      setGlobalError('Please complete the verification.');
      return;
    }

    const amountNumber = Number(sanitizeAmountInput(formValues.amount));

    const quizSummary = quizQuestions.map((question, idx) => {
      const answerValue = quizAnswers[idx];
      const option = question.options.find((opt) => opt.value === answerValue);
      return {
        id: question.id,
        question: question.prompt,
        answerValue,
        answerLabel: option?.label ?? null,
      };
    });

    const scoresResult = computedScores ?? null;

    const payload: Record<string, unknown> = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim(),
      phone: sanitizePhoneInput(formValues.phone),
      address1: formValues.address1.trim(),
      address2: formValues.address2.trim(),
      city: formValues.city.trim(),
      state: formValues.state.trim(),
      zip: formValues.zip.trim(),
      amount: amountNumber,
      page: '/financing',
      cfToken,
      hp_field: honeypot,
      quizSummary,
    };
    if (scoresResult) {
      payload.scores = scoresResult;
    }

    setSubmission('submitting');
    setGlobalError(null);

    try {
      const res = await fetch('/api/financing-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({} as any));
      if (res.ok && json?.ok) {
        setSubmission('idle');
        setUnlocked(true);
        setShowCalculator(true);
        setContactEditMode(false);
        const nextAmount = amountNumber || defaultAmount;
        setCalculatorAmount(nextAmount);
        setSubmittedAmount(nextAmount);
        const cookiePayload: FinancingCookie = { unlocked: true, amount: nextAmount };
        if (scoresResult) {
          cookiePayload.scores = scoresResult;
        }
        setPersistedScores(scoresResult);
        writeCookie(COOKIE_NAME, JSON.stringify(cookiePayload), COOKIE_MAX_AGE);
        try {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({ event: 'financing_calculator_submit', form: 'monthly_estimator' });
        } catch { }
        return;
      }
      setSubmission('error');
      setGlobalError(friendlyError(json?.error));
    } catch {
      setSubmission('error');
      setGlobalError('Network error. Please try again.');
    }
  };

  const totalFlowSteps = effectiveLastStepIndex + 1;
  const clampedStep = Math.min(Math.max(step, 0), effectiveLastStepIndex);
  const progressPercent = Math.round(((clampedStep + 1) / totalFlowSteps) * 100);

  const isQuizStep = step < totalQuizQuestions;
  const totalFormSteps = allowContactSteps ? 4 : 1;
  const formStepNumber = Math.min(step - summaryStepIndex + 1, totalFormSteps);
  const stepTitle = isQuizStep
    ? `Question ${step + 1} of ${totalQuizQuestions}`
    : `Step ${formStepNumber} of ${totalFormSteps}`;
  const stepSubtitle = isQuizStep
    ? 'Tap an option to continue.'
    : step === summaryStepIndex
      ? 'Almost there! Hit “Next” to continue.'
      : 'Fill out each field to continue.';
  const nextDisabled = isQuizStep && quizAnswers[step] == null;

  const renderStepFields = (stepIndex: number) => {
    const isQuiz = stepIndex < totalQuizQuestions;

    if (isQuiz) {
      const question = quizQuestions[stepIndex];
      const answer = quizAnswers[stepIndex];

      return (
        <div className={stepCardClass} aria-live="polite">
          <p className="text-base font-semibold text-slate-900">{question.prompt}</p>
          <div className="mt-4 flex flex-col gap-2">
            {question.options.map((option) => {
              const selected = answer === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQuizAnswer(stepIndex, option.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${selected
                    ? 'border-[--brand-blue] bg-[--brand-blue]/10 text-[--brand-blue] focus-visible:ring-[--brand-blue]/40'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[--brand-blue]/40 hover:bg-[--brand-blue]/5 focus-visible:ring-[--brand-blue]/40'
                    }`}
                  aria-pressed={selected}
                >
                  <span>{option.label}</span>
                  {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (stepIndex === summaryStepIndex) {
      const summaryItems = quizQuestions.map((question, idx) => ({
        id: question.id,
        prompt: question.prompt,
        answer: quizAnswers[idx],
        answerLabel: question.options.find((option) => option.value === quizAnswers[idx])?.label ?? 'Not answered',
      }));

      return (
        <div className={stepCardClass} aria-live="polite">
          <p
            className="text-base font-semibold text-slate-900"
          >
            Your answers
            <ArrowDown className='h-4 w-4 inline ml-2' />
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {summaryItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-blue-100 bg-white/80 px-3 py-2">
                <p className="font-medium text-slate-900">{item.prompt}</p>
                <p className="text-xs text-slate-600">{item.answerLabel}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs italic text-slate-500">Almost there! Hit “Next” to continue.</p>
        </div>
      );
    }

    if (stepIndex === firstFormStepIndex) {
      return (
        <div className={stepCardClass} aria-live="polite">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="firstName">First name*</label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              className={inputBaseClass}
              value={formValues.firstName}
              onChange={(e) => setFormValues((prev) => ({ ...prev, firstName: e.target.value }))}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="lastName">Last name*</label>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              className={inputBaseClass}
              value={formValues.lastName}
              onChange={(e) => setFormValues((prev) => ({ ...prev, lastName: e.target.value }))}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
          <div>
            <label className="block text-md font-medium text-slate-700" htmlFor="amount">Project Budget*</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex h-10 items-center rounded-lg bg-[--brand-blue] px-3 text-white shadow-sm">$</span>
              <input
                id="amount"
                name="amount"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-blue-100 bg-white/95 px-3 text-slate-900 shadow-sm outline-none focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
                value={formValues.amount}
                onChange={(e) => {
                  const digits = sanitizeAmountInput(e.target.value);
                  setFormValues((prev) => ({ ...prev, amount: digits }));
                }}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">We will prefill the calculator with this amount.</p>
            {errors.amount && (
              <p id="amount-error" className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>
        </div>
      );
    }

    if (stepIndex === secondFormStepIndex) {
      return (
        <div className={stepCardClass} aria-live="polite">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="address1">Property address*</label>
            <input
              id="address1"
              name="address1"
              autoComplete="address-line1"
              className={inputBaseClass}
              value={formValues.address1}
              onChange={(e) => setFormValues((prev) => ({ ...prev, address1: e.target.value }))}
              aria-invalid={Boolean(errors.address1)}
              aria-describedby={errors.address1 ? 'address1-error' : undefined}
            />
            {errors.address1 && (
              <p id="address1-error" className="mt-1 text-sm text-red-600">{errors.address1}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="address2">Address line 2 (optional)</label>
            <input
              id="address2"
              name="address2"
              autoComplete="address-line2"
              className={inputBaseClass}
              value={formValues.address2}
              onChange={(e) => setFormValues((prev) => ({ ...prev, address2: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="city">City*</label>
              <input
                id="city"
                name="city"
                autoComplete="address-level2"
                className={inputBaseClass}
                value={formValues.city}
                onChange={(e) => setFormValues((prev) => ({ ...prev, city: e.target.value }))}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? 'city-error' : undefined}
              />
              {errors.city && (
                <p id="city-error" className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="state">State*</label>
              <select
                id="state"
                name="state"
                autoComplete="address-level1"
                className={`${inputBaseClass} pr-8`}
                value={formValues.state}
                onChange={(e) => setFormValues((prev) => ({ ...prev, state: e.target.value }))}
                aria-invalid={Boolean(errors.state)}
                aria-describedby={errors.state ? 'state-error' : undefined}
              >
                {US_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p id="state-error" className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="zip">ZIP code*</label>
              <input
                id="zip"
                name="zip"
                inputMode="numeric"
                autoComplete="postal-code"
                className={inputBaseClass}
                value={formValues.zip}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setFormValues((prev) => ({ ...prev, zip: digits }));
                }}
                aria-invalid={Boolean(errors.zip)}
                aria-describedby={errors.zip ? 'zip-error' : undefined}
              />
              {errors.zip && (
                <p id="zip-error" className="mt-1 text-sm text-red-600">{errors.zip}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={stepCardClass} aria-live="polite">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email*</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputBaseClass}
            value={formValues.email}
            onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="phone">Phone*</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className={inputBaseClass}
            value={formatPhoneDisplay(formValues.phone)}
            onChange={(e) => setFormValues((prev) => ({ ...prev, phone: sanitizePhoneInput(e.target.value) }))}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
        <p className="mt-3 text-xs italic text-slate-500">Quick verification keeps spam away. It never impacts your credit.</p>
        <div className="pt-2">
          <Turnstile className="pt-1" />
        </div>
      </div>
    );
  };


  if (!unlocked || !showCalculator) {
    return (
      <div id="estimator" className={gradientShell}>
        <form onSubmit={handleSubmit} noValidate className={innerPanel}>
          <span className="sr-only" aria-live="polite">{liveStatus}</span>
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-3xl bg-blue-50 px-6 py-4">
            <div className="flex items-center gap-2 text-slate-900">
              <SearchCheck className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="text-lg font-semibold md:text-xl">Find the Right Financing Plan</h3>
            </div>
          </header>

          {unlocked && (
            <div className="bg-blue-50/40 flex justify-end py-6 pr-6">
              <button
                type="button"
                onClick={handleShowCalculatorView}
                className="text-sm font-semibold text-[--brand-blue] underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]"
              >
                <Calculator className='h-4 w-4 inline mr-2 text-[--brand-blue]' />
                To Calculator
                <Forward className='h-5 w-5 inline ml-2 text-[--brand-blue]' />
              </button>
            </div>
          )}

          <div className="bg-blue-50/40 text-sm text-slate-600 px-8 pt-6">
            Answer a few quick questions to reveal monthly payment estimates for YGrene and Service Finance programs.
          </div>

          <div className="space-y-6 bg-blue-50/40 px-6 py-6">
            <div className="flex flex-col gap-2 rounded-2xl border border-blue-100/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span>{stepTitle}</span>
                <div
                  className="flex items-center gap-2 text-xs text-slate-500"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                  aria-label="Progress"
                >
                  <div className="relative h-1.5 w-28 overflow-hidden rounded-full bg-slate-200/80 md:w-32">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[--brand-blue] transition-all duration-300 ease-in-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="min-w-[3ch] text-xs font-semibold text-slate-600">{progressPercent}%</span>
                </div>
              </div>
              <span className="text-slate-500 md:hidden">{stepSubtitle}</span>
              <span className={`${infoPillClass} hidden md:inline-flex`}>{stepSubtitle}</span>
            </div>

            <LayoutGroup>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`step-${step}`}
                  layout
                  ref={stepContentRef}
                  tabIndex={-1}
                  className="focus:outline-none"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.32, 0, 0.15, 1] }}
                >
                  {renderStepFields(step)}
                </motion.div>
              </AnimatePresence>
            </LayoutGroup>

            {globalError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm" role="alert">
                {globalError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100/70 bg-white/80 px-4 py-3 shadow-sm">
              <button
                type="button"
                onClick={step > 0 ? handleBack : undefined}
                className={`inline-flex items-center gap-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue] ${step === 0 ? 'cursor-not-allowed opacity-60' : ''}`}
                disabled={step === 0}
              >
                <Undo2
                  className={`h-4 w-4 ${step === 0 ? 'text-slate-400' : 'text-[--brand-blue]'}`}
                  aria-hidden="true"
                />
                <span className={step === 0 ? 'text-slate-400' : 'text-[--brand-blue]'}>Back</span>
              </button>

              <div className="flex-1 text-center text-xs italic text-slate-500">
                No credit check needed — you’re just exploring options.
              </div>

              {step < thirdFormStepIndex ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-brand-blue btn-md inline-flex items-center gap-2"
                  disabled={nextDisabled}
                >
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-brand-orange btn-md inline-flex items-center gap-2"
                  disabled={submission === 'submitting'}
                >
                  {submission === 'submitting' ? 'Sending…' : 'Show my results'}
                  {submission !== 'submitting' && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }


  return (
    <div id="estimator" className={gradientShell}>
      <section className={innerPanel}>
        <header className="flex items-center justify-between gap-3 rounded-t-3xl bg-blue-50 px-6 py-4">
          <div className="flex items-center gap-2 text-slate-900">
            <SearchCheck className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
            <h3 className="text-lg font-semibold md:text-xl">Find the Right Financing Plan</h3>
          </div>
          <span className={successPillClass}>
            <LockKeyholeOpen className="mr-2 h-3 w-3 inline" />
            Unlocked
          </span>
        </header>

        <div className="space-y-6 bg-blue-50/40 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReturnToQuiz}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[--brand-blue] underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              Back to Quiz
            </button>
            <button
              type="button"
              onClick={handleStartContactEdit}
              className="text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-[--brand-blue] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]"
            >
              Update Contact Info
              <UserRoundPen className='h-4 w-4 ml-2 inline' />
            </button>
          </div>

          {displayScores && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                <h3
                  className="text-xl md:text-2xl font-semibold text-emerald-700"
                >
                  <ChartBar className='h-5 w-5 md:h-6 md:w-6 inline text-emerald-700 mr-3' />
                  Program Fit Snapshot
                </h3>
                {leadingProgram ? (
                  <span className="text-sm font-semibold text-emerald-600">
                    Leading Fit
                    <ArrowRight className='inline h-4 w-4 text-emerald-600 mx-2' />
                    {MATCH_PROGRAMS[leadingProgram].label}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-emerald-600">Scores based on your answers</span>
                )}
              </div>
              <div className="mt-3 space-y-3">
                {(['serviceFinance', 'ygrene'] as FinancingProgramKey[]).map((programKey) => {
                  const score =
                    programKey === 'serviceFinance'
                      ? displayScores.serviceFinanceScore
                      : displayScores.ygreneScore;
                  const barColor =
                    programKey === 'serviceFinance' ? 'bg-[--brand-blue]' : 'bg-[--brand-orange]';
                  const detailHref = PROGRAM_DETAIL_ANCHORS[programKey];
                  const rawAnimated = animatedScores[programKey] ?? 0;
                  const clampedAnimated = Math.min(Math.max(rawAnimated, 0), score);
                  const displayedMatch = Math.min(Math.round(clampedAnimated), score);
                  const barPercent = Math.min(Math.max(clampedAnimated, 0), 100);
                  return (
                    <div key={programKey} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-slate-800">{MATCH_PROGRAMS[programKey].label}</span>
                          <a
                            href={detailHref}
                            className="group inline-flex items-center gap-[0.10rem] text-xs font-semibold text-[--brand-blue] underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]"
                          >
                            see details
                            <ChevronRight className="h-3 w-3 text-slate-600 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1" aria-hidden="true" />
                          </a>
                        </div>
                        <span className="text-lg font-semibold text-slate-800">{displayedMatch}% match</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/70">
                        <div className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${barPercent}%` }} />
                      </div>
                      <p className="text-md text-slate-500">{MATCH_PROGRAMS[programKey].description}</p>
                    </div>
                  );
                })}
              </div>
              {displayScores.isUncertain && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
                  <p className="font-semibold">Looks like both programs may require a closer look.</p>
                  <p className="mt-1">Let’s chat and help you find the best fit.</p>
                  <a className="mt-2 inline-block font-semibold text-[--brand-blue]" href="tel:+19419286964">
                    (941) 866-4320
                  </a>
                </div>
              )}
            </div>
          )}


          <div className="space-y-4 rounded-2xl px-4 py-4">
            <label
              htmlFor="activeAmount"
              className="block text-md font-medium text-slate-700"
            >

              Est. Budget
            </label>
            <div className="flex items-center gap-[0.35rem]">
              <DollarSign className="h-6 w-6 text-[--brand-blue]" />
              <input
                id="activeAmount"
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-10 w-full rounded-lg border border-blue-100 bg-white/95 px-3 text-slate-900 shadow-sm outline-none focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
                value={calculatorAmount}
                onChange={(e) => {
                  const digits = sanitizeAmountInput(e.target.value);
                  setCalculatorAmount(Number(digits) || 0);
                }}
                min={1000}
                step={500}
              />
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {amountChips.map((value) => {
                const selected = calculatorAmount === value;
                const isCustom = submittedAmount != null && Math.round(submittedAmount) === value && !FINANCING_PRESETS.includes(value);
                const className = selected
                  ? isCustom
                    ? 'border-[--brand-orange] bg-[--brand-orange]/20 text-[--brand-orange] shadow-[0_0_0_2px_rgba(249,115,22,0.35)]'
                    : 'border-[--brand-blue] bg-[--brand-blue] text-white'
                  : isCustom
                    ? 'border-[--brand-orange]/60 bg-[--brand-orange]/10 text-[--brand-orange] hover:bg-[--brand-orange]/15'
                    : 'border-blue-100 bg-white hover:bg-blue-50/60';
                return (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-full border px-3 py-1 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
                    style={isCustom && selected && customPulse ? { animation: 'chip-pop 0.85s ease-out' } : undefined}
                    onClick={() => handleSelectAmount(value)}
                    aria-label={`Set amount to ${currency(value)}`}
                    aria-pressed={selected}
                  >
                    {currency(value).replace('.00', '')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-white shadow-md">
            <div className="text-center border-b border-blue-100 p-4 text-2xl font-semibold text-[--brand-blue]">
              Est. Monthly Payment
              <ArrowDown className='h-6 w-6 text-[--brand-blue] inline ml-2' />
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="bg-blue-100/60 border-b border-blue-100 text-md font-semibold uppercase tracking-wide text-slate-600">
                    <td className="px-4 py-2" colSpan={2}>
                      {MATCH_PROGRAMS.serviceFinance.label} Programs
                    </td>
                  </tr>
                  {groupedPayments.service.map(({ program, amount }, idx) => (
                    <tr key={program.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'}>
                      <td className="text-md px-4 py-3 font-medium text-slate-900">
                        <div>{program.label}</div>
                        {program.summary && (
                          <div className="text-sm font-normal text-slate-500">{program.summary}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {currency(amount)}/mo
                        {program.footnote && (
                          <span className="ml-2 text-sm text-slate-500">{program.footnote}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-100/60 border-t border-b border-amber-100 text-md font-semibold uppercase tracking-wide text-slate-600">
                    <td className="px-4 py-2" colSpan={2}>
                      {MATCH_PROGRAMS.ygrene.label} Financing
                    </td>
                  </tr>
                  {groupedPayments.ygrene.map(({ program, amount }, idx) => (
                    <tr key={program.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'}>
                      <td className="text-md px-4 py-3 font-medium text-slate-900">
                        <div>{program.label}</div>
                        {program.summary && (
                          <div className="text-sm font-normal text-slate-500">{program.summary}</div>
                        )}
                      </td>
                      <td className="text-md px-4 py-3 text-right font-semibold text-slate-900">
                        {currency(amount)}/mo
                        {program.footnote && (
                          <span className="ml-2 text-sm text-slate-500">{program.footnote}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-6 flex-wrap justify-center">
            <a
              className="group inline-flex items-center text-md font-semibold text-[--brand-blue] hover:underline"
              href="#docs"
            >
              <HelpCircle className="h-5 w-4 mr-2 inline text-slate-600" />
              What documents will I need?
              <ChevronRight className="h-4 w-4 ml-[0.10rem] inline text-slate-600 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1" />
            </a>
            <a
              className="group inline-flex items-center text-md font-semibold text-[--brand-blue] hover:underline"
              href="#pick-a-plan"
            >
              <HelpCircle className="h-5 w-4 mr-2 inline text-slate-600" />
              What's the next step?
              <ChevronRight className="h-4 w-4 ml-[0.10rem] inline text-slate-600 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1" />
            </a>
          </div>

          <p className="text-xs italic text-slate-500">
            Estimates only. Not a credit offer. Promo terms, deferral windows, and final payments are set by the lender. Estimates do not include loan origination fees.
          </p>
        </div>
      </section>
      <style jsx>{`
        @keyframes chip-pop {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.2);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.12);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
          }
        }

      `}</style>
    </div>
  );

}
