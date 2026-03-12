'use client';

import SmartLink from '@/components/utils/SmartLink';
import { cn } from '@/lib/utils';
import type { SmsConsentFieldValue } from '@/lib/lead-capture/contact-lead';

type SmsConsentFieldName = 'smsProjectConsent' | 'smsMarketingConsent';

type SmsConsentErrors = Partial<Record<SmsConsentFieldName, string>>;

type Props = {
  smsProjectConsent: SmsConsentFieldValue;
  smsMarketingConsent: SmsConsentFieldValue;
  onChange: (field: SmsConsentFieldName, value: SmsConsentFieldValue) => void;
  errors?: SmsConsentErrors;
  className?: string;
  companyName?: string;
};

const DISCLOSURE_TEXT =
  'Messaging rates vary based on your project needs. You can opt out at any time by replying STOP. Reply HELP if you are experiencing issues. Message/data rates apply.';

function ConsentCard({
  name,
  label,
  value,
  onChange,
  error,
}: {
  name: SmsConsentFieldName;
  label: string;
  value: SmsConsentFieldValue;
  onChange: (field: SmsConsentFieldName, value: SmsConsentFieldValue) => void;
  error?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <fieldset
      className={cn(
        'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4',
        error && 'border-red-300'
      )}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <div className="text-base font-semibold text-slate-700">{label}</div>
      <div className="mt-2 flex items-center gap-8">
        <label className="inline-flex items-center gap-2 text-slate-700">
          <input
            type="radio"
            name={name}
            value="yes"
            checked={value === 'yes'}
            onChange={() => onChange(name, 'yes')}
            className="h-4 w-4 border-slate-300 text-[--brand-blue] focus:ring-[--brand-blue]"
          />
          <span className="text-sm leading-none">Yes</span>
        </label>
        <label className="inline-flex items-center gap-2 text-slate-700">
          <input
            type="radio"
            name={name}
            value="no"
            checked={value === 'no'}
            onChange={() => onChange(name, 'no')}
            className="h-4 w-4 border-slate-300 text-[--brand-blue] focus:ring-[--brand-blue]"
          />
          <span className="text-sm leading-none">No</span>
        </label>
      </div>
      <p className="mt-3 text-xs text-slate-500">{DISCLOSURE_TEXT}</p>
      {error && (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default function SmsConsentFields({
  smsProjectConsent,
  smsMarketingConsent,
  onChange,
  errors,
  className,
  companyName = 'SonShine Roofing',
}: Props) {
  return (
    <section className={cn('space-y-4', className)}>
      <ConsentCard
        name="smsProjectConsent"
        label="I'd like to receive SMS messages about my project."
        value={smsProjectConsent}
        onChange={onChange}
        error={errors?.smsProjectConsent}
      />
      <ConsentCard
        name="smsMarketingConsent"
        label={`I'd like to receive SMS marketing messages from ${companyName}.`}
        value={smsMarketingConsent}
        onChange={onChange}
        error={errors?.smsMarketingConsent}
      />
      <div className="border-t border-slate-200 pt-4 text-sm text-slate-600">
        <p>
          By submitting this form, you authorize {companyName} to reach out to you about your
          project. We will never share your personal information with third parties for marketing
          purposes. You can opt out at any time. Consent is not a condition of purchase.
        </p>
        <p className="mt-2 font-semibold text-[--brand-blue]">
          <SmartLink href="/sms-terms-and-conditions">Terms &amp; Conditions</SmartLink>
          {' | '}
          <SmartLink href="/privacy-policy">Privacy Policy</SmartLink>
        </p>
      </div>
    </section>
  );
}
