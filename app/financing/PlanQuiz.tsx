// components/finance/PlanQuiz.tsx
'use client';

import { useMemo, useState } from 'react';

type YN = 'yes' | 'no' | null;

export default function PlanQuiz() {
  const [equity, setEquity] = useState<YN>(null);      // Do you have equity / current on property taxes?
  const [noLien, setNoLien] = useState<YN>(null);      // Prefer no lien on your home?
  const [defer, setDefer] = useState<YN>(null);        // Want to defer payments ~18–24 months?

  const result = useMemo(() => {
    let scoreY = 0; let scoreS = 0;

    if (equity === 'yes') scoreY += 2;
    if (equity === 'no') scoreS += 1;

    if (noLien === 'yes') scoreS += 2;     // signature loan preference
    if (noLien === 'no') scoreY += 1;

    if (defer === 'yes') scoreY += 2;      // YGrene commonly offers deferral
    if (defer === 'no') scoreS += 1;

    if (scoreY === 0 && scoreS === 0) return null;
    return scoreY >= scoreS ? 'YGrene (Equity-based)' : 'Service Financing (Credit-based)';
  }, [equity, noLien, defer]);

  const radio = (name: string, value: YN, setter: (v: YN) => void) => (
    <div className="flex gap-3">
      <label className="inline-flex items-center gap-2">
        <input type="radio" name={name} checked={value === 'yes'} onChange={() => setter('yes')} />
        <span>Yes</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="radio" name={name} checked={value === 'no'} onChange={() => setter('no')} />
        <span>No</span>
      </label>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-900">Which option fits me?</div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium">Do you have home equity and a clean recent property-tax history?</p>
          {radio('equity', equity, setEquity)}
        </div>
        <div>
          <p className="font-medium">Do you prefer a loan that does <em>not</em> place a lien on your home?</p>
          {radio('nolien', noLien, setNoLien)}
        </div>
        <div>
          <p className="font-medium">Would a payment deferral (~18–24 months) help?</p>
          {radio('defer', defer, setDefer)}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
        {result ? (
          <p><span className="font-semibold">Likely fit:</span> {result}. We’ll confirm details and eligibility with a quick call.</p>
        ) : (
          <p className="text-slate-600">Answer the questions to see a likely fit.</p>
        )}
      </div>
    </div>
  );
}