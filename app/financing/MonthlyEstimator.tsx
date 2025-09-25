// Financing lead magnet with gated calculator
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Calculator, Check, CheckCircle2, Lock, ArrowRight, Undo2, Wallet, X, SearchCheck, LockKeyholeOpen } from 'lucide-react';
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

// ============ STYLE CONSTANTS ====================== //
const pillBase = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-tight shadow-sm';
const infoPillClass = `${pillBase} text-slate-400`;
const successPillClass = `${pillBase} bg-emerald-500 text-white`;
const gradientShell = 'rounded-3xl bg-gradient-to-r from-[--brand-blue] to-[--brand-cyan] p-[1.5px] shadow-xl shadow-[rgba(0,69,215,0.12)]';
const innerPanel = 'rounded-3xl bg-white overflow-hidden';
const stepCardClass = 'space-y-4 rounded-2xl border border-blue-200 bg-white/85 p-5 shadow-sm backdrop-blur';
const inputBaseClass = 'mt-1 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20';

const quizQuestions = [
  {
    id: 'equity',
    prompt: 'Do you have home equity and a clean recent property-tax history?',
  },
  {
    id: 'noLien',
    prompt: 'Do you prefer a loan that does not place a lien on your home?',
  },
  {
    id: 'defer',
    prompt: 'Would a payment deferral (~18–24 months) help?',
  },
  {
    id: 'credit650',
    prompt: 'Is your credit score roughly 650+?',
  },
  {
    id: 'incomeDocs',
    prompt: 'Can you document income/employment for underwriting?',
  },
  {
    id: 'taxAssess',
    prompt: 'Are you comfortable with an assessment on your property tax bill?',
  },
  {
    id: 'sellSoon',
    prompt: 'Are you likely to sell your home within ~5 years?',
  },
];

type ProgramKey = 'serviceFinance' | 'ygrene';

const MATCH_PROGRAMS: Record<ProgramKey, { label: string; programIds: string[]; description: string }> = {
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

type AnswerImpact = {
  weight: number;
  reason: string;
};

type QuizScoringEntry = {
  yes?: Partial<Record<ProgramKey, AnswerImpact>>;
  no?: Partial<Record<ProgramKey, AnswerImpact>>;
};

const QUIZ_SCORING: Record<(typeof quizQuestions)[number]['id'], QuizScoringEntry> = {
  equity: {
    yes: {
      ygrene: {
        weight: 4,
        reason: 'You have equity and a strong property-tax history.',
      },
    },
    no: {
      serviceFinance: {
        weight: 3,
        reason: 'You prefer options that do not rely on property equity checks.',
      },
    },
  },
  noLien: {
    yes: {
      serviceFinance: {
        weight: 4,
        reason: 'You want financing without placing a lien on the property.',
      },
    },
    no: {
      ygrene: {
        weight: 3,
        reason: 'You are comfortable using property-tax-backed financing.',
      },
    },
  },
  defer: {
    yes: {
      ygrene: {
        weight: 3,
        reason: 'Up-front payment deferral is valuable to you.',
      },
    },
    no: {
      serviceFinance: {
        weight: 2,
        reason: 'You’re ready to begin payments without a long deferral.',
      },
    },
  },
  credit650: {
    yes: {
      serviceFinance: {
        weight: 3,
        reason: 'Your credit profile supports Service Finance underwriting.',
      },
    },
    no: {
      ygrene: {
        weight: 2,
        reason: 'You prefer options that aren’t credit-score heavy.',
      },
    },
  },
  incomeDocs: {
    yes: {
      serviceFinance: {
        weight: 2,
        reason: 'You can provide income documentation for approval.',
      },
    },
    no: {
      ygrene: {
        weight: 3,
        reason: 'You want to minimize income documentation requirements.',
      },
    },
  },
  taxAssess: {
    yes: {
      ygrene: {
        weight: 4,
        reason: 'You’re comfortable adding repayment to your property tax bill.',
      },
    },
    no: {
      serviceFinance: {
        weight: 3,
        reason: 'You want to keep payments off your property tax bill.',
      },
    },
  },
  sellSoon: {
    yes: {
      serviceFinance: {
        weight: 3,
        reason: 'You may sell soon and want financing that’s easier to close out.',
      },
    },
    no: {
      ygrene: {
        weight: 2,
        reason: 'You expect to stay long term, fitting YGrene’s structure.',
      },
    },
  },
};

const PROGRAM_MAX_SCORE = Object.keys(MATCH_PROGRAMS).reduce((acc, key) => {
  acc[key as ProgramKey] = 0;
  return acc;
}, {} as Record<ProgramKey, number>);

for (const entry of Object.values(QUIZ_SCORING)) {
  for (const programKey of Object.keys(MATCH_PROGRAMS) as ProgramKey[]) {
    const yesWeight = entry.yes?.[programKey]?.weight ?? 0;
    const noWeight = entry.no?.[programKey]?.weight ?? 0;
    PROGRAM_MAX_SCORE[programKey] += Math.max(yesWeight, noWeight, 0);
  }
}

type MatchResult = {
  program: ProgramKey;
  score: number;
  reasons: string[];
};

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
  match?: MatchResult;
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

function calculateMatch(answers: (boolean | null)[]): MatchResult | null {
  if (!answers.length) return null;
  if (answers.some((answer) => answer === null)) return null;

  const scores: Record<ProgramKey, number> = {
    serviceFinance: 0,
    ygrene: 0,
  };

  const reasonBuckets: Record<ProgramKey, { text: string; weight: number }[]> = {
    serviceFinance: [],
    ygrene: [],
  };

  answers.forEach((answer, idx) => {
    if (answer == null) return;
    const question = quizQuestions[idx];
    const config = QUIZ_SCORING[question.id];
    if (!config) return;
    const impacts = (answer ? config.yes : config.no) ?? {};
    for (const [program, impact] of Object.entries(impacts) as [ProgramKey, AnswerImpact][]) {
      scores[program] += impact.weight;
      reasonBuckets[program].push({ text: impact.reason, weight: impact.weight });
    }
  });

  let bestProgram: ProgramKey | null = null;
  let bestScore = -Infinity;
  (Object.entries(scores) as [ProgramKey, number][]).forEach(([program, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestProgram = program;
    }
  });

  if (!bestProgram || bestScore <= 0) return null;

  const bestProgramKey = bestProgram as ProgramKey;
  const maxScore = PROGRAM_MAX_SCORE[bestProgramKey] || 1;
  const percent = Math.min(100, Math.round((bestScore / maxScore) * 100));

  const topReasons = [...reasonBuckets[bestProgramKey]]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((item) => item.text);

  return {
    program: bestProgramKey,
    score: percent,
    reasons: topReasons,
  };
}

function formatReasonsSentence(reasons: string[]): string {
  if (!reasons.length) return '';
  if (reasons.length === 1) return `Because ${reasons[0].toLowerCase()}`;
  if (reasons.length === 2) {
    return `Because ${reasons[0].toLowerCase()} and ${reasons[1].toLowerCase()}`;
  }
  const [first, second, third] = reasons;
  return `Because ${first.toLowerCase()}, ${second.toLowerCase()}, and ${third.toLowerCase()}`;
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
  const [persistedMatch, setPersistedMatch] = useState<MatchResult | null>(null);
  const [customPulse, setCustomPulse] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

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
      setCalculatorAmount(roundedAmount);
      setFormValues((prev) => ({ ...prev, amount: String(roundedAmount) }));
      setSubmittedAmount(roundedAmount);
      setPersistedMatch(cookie.match ?? null);
      setShowMatchDetails(false);
    }
  }, [defaultAmount]);


  const [quizAnswers, setQuizAnswers] = useState<(boolean | null)[]>(() => Array(totalQuizQuestions).fill(null));
  const computedMatch = useMemo(() => calculateMatch(quizAnswers), [quizAnswers]);

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

  const displayMatch = persistedMatch ?? computedMatch;

  useEffect(() => {
    if (!customPulse) return;
    const timeout = setTimeout(() => setCustomPulse(false), 800);
    return () => clearTimeout(timeout);
  }, [customPulse]);

  useEffect(() => {
    if (!persistedMatch) return;
    setShowMatchDetails(false);
  }, [persistedMatch?.program]);

  useEffect(() => {
    if (!displayMatch) {
      setShowMatchDetails(false);
    }
  }, [displayMatch]);

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

  const handleQuizAnswer = (index: number, value: boolean) => {
    const next = [...quizAnswers];
    next[index] = value;
    setQuizAnswers(next);
    setErrors({});
    setGlobalError(null);
    const targetStep = index === totalQuizQuestions - 1 ? summaryStepIndex : index + 1;
    setStep(targetStep);
  };

  const handleNext = () => {
    setGlobalError(null);
    setErrors({});

    if (step < totalQuizQuestions) {
      if (quizAnswers[step] == null) {
        setGlobalError('Select yes or no to continue.');
        return;
      }
      setStep(step + 1);
      return;
    }

    if (step === summaryStepIndex) {
      setStep(step + 1);
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

  const friendlyError = (raw?: unknown) => {
    if (!raw || typeof raw !== 'string') return 'We could not send your request. Please try again.';
    if (raw.toLowerCase().includes('rating')) return 'We could not send your request just now. Please try again in a moment.';
    return raw;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submission === 'submitting') return;

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

    const quizSummary = quizQuestions.map((question, idx) => ({
      id: question.id,
      question: question.prompt,
      answer: quizAnswers[idx] ? 'yes' : 'no',
    }));

    const matchResult = computedMatch || null;

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
    if (matchResult) {
      payload.match = matchResult;
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
        const nextAmount = amountNumber || defaultAmount;
        setCalculatorAmount(nextAmount);
        setSubmittedAmount(nextAmount);
        const cookiePayload: FinancingCookie = { unlocked: true, amount: nextAmount };
        if (matchResult) {
          cookiePayload.match = matchResult;
        }
        setPersistedMatch(matchResult);
        setShowMatchDetails(false);
        writeCookie(COOKIE_NAME, JSON.stringify(cookiePayload), COOKIE_MAX_AGE);
        try {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({ event: 'financing_calculator_submit', form: 'monthly_estimator' });
        } catch {}
        return;
      }
      setSubmission('error');
      setGlobalError(friendlyError(json?.error));
    } catch {
      setSubmission('error');
      setGlobalError('Network error. Please try again.');
    }
  };

  const isQuizStep = step < totalQuizQuestions;
  const totalFormSteps = 4;
  const formStepNumber = step - summaryStepIndex + 1;
  const stepTitle = isQuizStep
    ? `Question ${step + 1} of ${totalQuizQuestions}`
    : `Step ${formStepNumber} of ${totalFormSteps}`;
  const stepSubtitle = isQuizStep
    ? 'Tap yes or no to continue.'
    : step === summaryStepIndex
      ? 'Almost there! Hit “Next” to continue.'
      : 'Fill out each field to continue.';
  const nextDisabled = isQuizStep && quizAnswers[step] == null;

  const renderStepFields = () => {
    if (isQuizStep) {
      const question = quizQuestions[step];
      const answer = quizAnswers[step];
      const yesSelected = answer === true;
      const noSelected = answer === false;

      return (
        <div className={stepCardClass} aria-live="polite">
          <p className="text-base font-semibold text-slate-900">{question.prompt}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                yesSelected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 focus:ring-emerald-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 focus:ring-emerald-200'
              }`}
              onClick={() => handleQuizAnswer(step, true)}
              aria-pressed={yesSelected}
            >
              <Check className="h-4 w-4 text-emerald-900" aria-hidden="true" />
              <span>Yes</span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                noSelected
                  ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-red-50 focus:ring-red-200'
              }`}
              onClick={() => handleQuizAnswer(step, false)}
              aria-pressed={noSelected}
            >
              <X className="h-4 w-4 text-red-900" aria-hidden="true" />
              <span>No</span>
            </button>
          </div>
        </div>
      );
    }

    if (step === summaryStepIndex) {
      const summaryItems = quizQuestions.map((question, idx) => ({
        id: question.id,
        prompt: question.prompt,
        answer: quizAnswers[idx],
      }));

      return (
        <div className={stepCardClass} aria-live="polite">
          <p className="text-base font-semibold text-slate-900">Your answers</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {summaryItems.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="text-lg">{item.answer ? '✅' : item.answer === false ? '❌' : '❔'}</span>
                <span>{item.prompt}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs italic text-slate-500">Almost there! Hit “Next” to continue.</p>
        </div>
      );
    }

    if (step === firstFormStepIndex) {
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
            <label className="block text-sm font-medium text-slate-700" htmlFor="amount">Estimated project total*</label>
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

    if (step === secondFormStepIndex) {
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

  if (!unlocked) {
    return (
      <div id="estimator" className={gradientShell}>
        <form onSubmit={handleSubmit} noValidate className={innerPanel}>
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

          <div className="bg-blue-50/40 text-sm text-slate-600 px-8 pt-6">
            Answer a few quick questions to reveal monthly payment estimates for YGrene and Service Finance programs.
          </div>

          <div className="space-y-6 bg-blue-50/40 px-6 py-6">
            <div className="flex flex-col gap-2 rounded-2xl border border-blue-100/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm md:flex-row md:items-center md:justify-between">
              <span>{stepTitle}</span>
              <span className="text-slate-500 md:hidden">{stepSubtitle}</span>
              <span className={`${infoPillClass} hidden md:inline-flex`}>{stepSubtitle}</span>
            </div>

            {renderStepFields()}

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
            <Calculator className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
            <h2 className="text-lg font-semibold md:text-xl">Monthly Payment Calculator</h2>
          </div>
          <span className={successPillClass}>
            <LockKeyholeOpen className="mr-2 h-3 w-3 inline" />
            Unlocked
          </span>
        </header>

        <div className="space-y-6 bg-blue-50/40 px-6 py-6">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-500" aria-hidden="true" />
            <div>
              <p className="font-semibold">Calculator unlocked.</p>
              <p>Adjust your project total to explore updated payments for each program.</p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-blue-100/70 bg-white/85 px-4 py-4 shadow-sm">
            <label htmlFor="activeAmount" className="block text-sm font-medium text-slate-700">Estimated Project Total</label>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 items-center rounded-lg bg-[--brand-blue] px-3 text-white shadow-sm">$</span>
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

          <div className="rounded-2xl border border-blue-100 bg-white shadow-md">
            <div className="border-b border-blue-100 px-4 py-3 text-center text-md font-medium text-slate-700">
              Estimated Monthly Payment
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="bg-blue-100/60 border-b border-blue-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    <td className="px-4 py-2" colSpan={2}>
                      {MATCH_PROGRAMS.serviceFinance.label} Programs
                    </td>
                  </tr>
                  {groupedPayments.service.map(({ program, amount }, idx) => (
                    <tr key={program.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{program.label}</div>
                        {program.summary && (
                          <div className="text-xs font-normal text-slate-500">{program.summary}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {currency(amount)}/mo
                        {program.footnote && (
                          <span className="ml-2 text-xs text-slate-500">{program.footnote}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-100/60 border-t border-b border-amber-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    <td className="px-4 py-2" colSpan={2}>
                      {MATCH_PROGRAMS.ygrene.label} Financing
                    </td>
                  </tr>
                  {groupedPayments.ygrene.map(({ program, amount }, idx) => (
                    <tr key={program.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{program.label}</div>
                        {program.summary && (
                          <div className="text-xs font-normal text-slate-500">{program.summary}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {currency(amount)}/mo
                        {program.footnote && (
                          <span className="ml-2 text-xs text-slate-500">{program.footnote}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {displayMatch && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-emerald-700">
                  Likely fit: {MATCH_PROGRAMS[displayMatch.program].label}
                </p>
                <span className="text-sm font-semibold text-emerald-600">{displayMatch.score}% match</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMatchDetails((prev) => !prev)}
                className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
              >
                {showMatchDetails ? 'Hide ↑' : 'Why this match? →'}
              </button>
              {showMatchDetails && (
                <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                  {displayMatch.reasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
