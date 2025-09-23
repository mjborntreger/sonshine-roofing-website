// Financing lead magnet with gated calculator
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Lock, ArrowRight, Undo2 } from 'lucide-react';
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

type Step = 0 | 1 | 2;

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
  return value.replace(/\D/g, '').slice(0, 10);
}

function formatPhoneDisplay(digits: string) {
  const d = sanitizePhoneInput(digits);
  if (!d) return '';
  const area = d.slice(0, 3);
  const mid = d.slice(3, 6);
  const last = d.slice(6, 10);
  if (d.length <= 3) return `(${area}`;
  if (d.length <= 6) return `(${area}) ${mid}`;
  return `(${area}) ${mid}-${last}`;
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

function validateStep(step: Step, values: FormValues) {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (!values.firstName.trim()) errors.firstName = 'Enter your first name';
    if (!values.lastName.trim()) errors.lastName = 'Enter your last name';
  }
  if (step === 1) {
    if (!values.address1.trim()) errors.address1 = 'Enter the property address';
    if (!values.city.trim()) errors.city = 'City is required';
    if (!values.state.trim()) errors.state = 'Select a state';
    if (!isZipValid(values.zip)) errors.zip = 'Enter 5-digit ZIP';
    const amountDigits = sanitizeAmountInput(values.amount);
    const amountNumber = Number(amountDigits);
    if (!amountDigits || Number.isNaN(amountNumber) || amountNumber < 1000) {
      errors.amount = 'Enter a project total of at least $1,000';
    }
  }
  if (step === 2) {
    if (!isEmailValid(values.email)) errors.email = 'Enter a valid email (example@domain.com)';
    if (sanitizePhoneInput(values.phone).length !== 10) errors.phone = 'Enter a 10-digit phone number';
  }
  return errors;
}

export default function MonthlyEstimator({ defaultAmount = 15000 }: { defaultAmount?: number }) {
  const [step, setStep] = useState<Step>(0);
  const [submission, setSubmission] = useState<SubmissionState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState(defaultAmount);

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
      setUnlocked(true);
      setCalculatorAmount(amt);
      setFormValues((prev) => ({ ...prev, amount: String(Math.round(amt)) }));
    }
  }, [defaultAmount]);

  const paymentRows = useMemo(
    () =>
      FINANCING_PROGRAMS.map((program) => ({
        program,
        amount: monthlyPayment(calculatorAmount, program.apr, program.termMonths),
      })),
    [calculatorAmount]
  );

  const handleNext = () => {
    const stepErrors = validateStep(step, formValues);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((prev) => Math.min(2, (prev + 1) as Step));
  };

  const handleBack = () => {
    setErrors({});
    setGlobalError(null);
    setStep((prev) => Math.max(0, (prev - 1) as Step));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submission === 'submitting') return;

    const stepErrors = validateStep(2, formValues);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
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

    const payload = {
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
    };

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
        writeCookie(COOKIE_NAME, JSON.stringify({ unlocked: true, amount: nextAmount }), COOKIE_MAX_AGE);
        try {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({ event: 'financing_calculator_submit', form: 'monthly_estimator' });
        } catch {}
        return;
      }
      setSubmission('error');
      setGlobalError(json?.error || 'We could not send your request. Please try again.');
    } catch {
      setSubmission('error');
      setGlobalError('Network error. Please try again.');
    }
  };

  const renderStepFields = () => {
    if (step === 0) {
      return (
        <div className="space-y-4" aria-live="polite">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="firstName">First name*</label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
              value={formValues.lastName}
              onChange={(e) => setFormValues((prev) => ({ ...prev, lastName: e.target.value }))}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4" aria-live="polite">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="address1">Property address*</label>
            <input
              id="address1"
              name="address1"
              autoComplete="address-line1"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="amount">Estimated project total*</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex h-10 items-center rounded-lg bg-emerald-500 px-3 text-white">$</span>
              <input
                id="amount"
                name="amount"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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

    return (
      <div className="space-y-4" aria-live="polite">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email*</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
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
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
            value={formatPhoneDisplay(formValues.phone)}
            onChange={(e) => setFormValues((prev) => ({ ...prev, phone: sanitizePhoneInput(e.target.value) }))}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
        <Turnstile className="pt-1" />
      </div>
    );
  };

  if (!unlocked) {
    return (
      <div
        id="estimator"
        className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-center gap-2 text-2xl font-semibold text-slate-900">
          <Lock className="h-6 w-6 text-[--brand-blue]" aria-hidden="true" />
          Unlock Your Monthly Payment Estimates
        </div>
        <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-slate-600">
          Answer a few quick questions to reveal monthly payment estimates for YGrene and Service Finance programs.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />

          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <span>Step {step + 1} of 3</span>
            <span className="text-xs text-slate-500">Press Tab to reach each field.</span>
          </div>

          {renderStepFields()}

          {globalError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {globalError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-sm text-slate-600 transition hover:text-slate-800"
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-brand-blue btn-md inline-flex items-center gap-2"
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
        </form>
      </div>
    );
  }

  return (
    <div
      id="estimator"
      className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm"
    >
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="mt-1 h-6 w-6" aria-hidden="true" />
        <div>
          <p className="font-semibold">Calculator unlocked.</p>
          <p className="text-sm">Adjust your project total to explore updated payments for each program.</p>
        </div>
      </div>

      <div className="mb-8 text-center text-2xl font-semibold text-slate-900">
        <Calculator className="mr-2 inline h-6 w-6 text-[--brand-blue]" aria-hidden="true" />
        Monthly Payment Calculator
      </div>

      <label htmlFor="activeAmount" className="mb-3 block text-sm text-slate-700">Estimated project total</label>
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-flex h-10 items-center rounded-lg bg-emerald-500 px-3 text-white">$</span>
        <input
          id="activeAmount"
          inputMode="numeric"
          pattern="[0-9]*"
          className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-[--brand-blue] focus:ring-2 focus:ring-[--brand-blue]/20"
          value={calculatorAmount}
          onChange={(e) => {
            const digits = sanitizeAmountInput(e.target.value);
            setCalculatorAmount(Number(digits) || 0);
          }}
          min={1000}
          step={500}
        />
      </div>

      <div className="my-3 flex flex-wrap gap-2 text-sm">
        {FINANCING_PRESETS.map((preset) => {
          const selected = calculatorAmount === preset;
          return (
            <button
              key={preset}
              type="button"
              className={`rounded-full px-3 py-1 transition border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                selected ? 'bg-[--brand-blue] text-white border-[--brand-blue]' : 'border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => setCalculatorAmount(preset)}
              aria-label={`Set amount to ${currency(preset)}`}
              aria-pressed={selected}
            >
              {currency(preset).replace('.00', '')}
            </button>
          );
        })}
      </div>

      <div className="mb-2 mt-5 text-center text-sm text-slate-700">
        Estimated Monthly Payment
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <tbody className="[&>tr:nth-child(odd)]:bg-slate-50/40">
            {paymentRows.map(({ program, amount }) => (
              <tr key={program.id}>
                <td className="p-3 font-medium">
                  <div>{program.label}</div>
                  {program.summary && (
                    <div className="text-xs font-normal text-slate-500">{program.summary}</div>
                  )}
                </td>
                <td className="p-3 text-right">
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

      <p className="italic mt-2 text-xs text-slate-500">
        Estimates only. Not a credit offer. Promo terms, deferral windows, and final payments are set by the lender.
      </p>
    </div>
  );
}
