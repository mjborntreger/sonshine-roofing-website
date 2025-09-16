// components/finance/PlanQuiz.tsx
// components/finance/PlanQuiz.tsx
'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, ListChecks } from 'lucide-react';

type YN = 'yes' | 'no' | null;

export default function PlanQuiz() {
  const [equity, setEquity] = useState<YN>(null);          // Do you have equity / current on property taxes?
  const [noLien, setNoLien] = useState<YN>(null);          // Prefer no lien on your home?
  const [defer, setDefer] = useState<YN>(null);            // Want to defer payments ~18–24 months?
  const [credit650, setCredit650] = useState<YN>(null);    // Credit score roughly 650+?
  const [incomeDocs, setIncomeDocs] = useState<YN>(null);  // Able to document income/employment?
  const [taxAssess, setTaxAssess] = useState<YN>(null);    // Comfortable with assessment on property tax bill?
  const [sellSoon, setSellSoon] = useState<YN>(null);      // Planning to sell within ~5 years?
  const [showResult, setShowResult] = useState(false);     // Reveal result on click

  const totalQs = 7;
  const answered = [equity, noLien, defer, credit650, incomeDocs, taxAssess, sellSoon].filter(v => v !== null).length;

  // Icon style for this panel header (tweak here)
  const panelIcon = 'inline mr-2 h-6 w-6 text-[--brand-blue]';

  const result = useMemo(() => {
    let scoreY = 0; let scoreS = 0;

    if (equity === 'yes') scoreY += 2; else if (equity === 'no') scoreS += 1;
    if (noLien === 'yes') scoreS += 2; else if (noLien === 'no') scoreY += 1;
    if (defer === 'yes') scoreY += 2; else if (defer === 'no') scoreS += 1;

    if (credit650 === 'yes') scoreS += 2; else if (credit650 === 'no') scoreY += 1;
    if (incomeDocs === 'yes') scoreS += 2; else if (incomeDocs === 'no') scoreY += 1;
    if (taxAssess === 'yes') scoreY += 2; else if (taxAssess === 'no') scoreS += 1;
    if (sellSoon === 'yes') scoreY += 1; else if (sellSoon === 'no') scoreS += 1;

    if (scoreY === 0 && scoreS === 0) return null;
    return scoreY >= scoreS ? 'YGrene (Equity-based)' : 'Service Financing (Credit-based)';
  }, [equity, noLien, defer, credit650, incomeDocs, taxAssess, sellSoon]);

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
    <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
      <div className="mb-8 text-2xl text-center font-semibold text-slate-900">
        <ListChecks className={panelIcon} aria-hidden="true" />
        Pick Your Payment Plan
      </div>

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
        <div>
          <p className="font-medium">Is your credit score roughly 650+?</p>
          {radio('credit', credit650, setCredit650)}
        </div>
        <div>
          <p className="font-medium">Can you document income/employment for underwriting?</p>
          {radio('income', incomeDocs, setIncomeDocs)}
        </div>
        <div>
          <p className="font-medium">Are you comfortable with an assessment on your property tax bill?</p>
          {radio('tax', taxAssess, setTaxAssess)}
        </div>
        <div>
          <p className="font-medium">Are you likely to sell your home within ~5 years?</p>
          {radio('sell', sellSoon, setSellSoon)}
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-600 order-2 sm:order-1">Answered {answered}/{totalQs}. For best results, answer all.</p>
        <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2 w-full sm:w-auto">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-press w-full sm:w-auto"
            onClick={() => {
              setEquity(null);
              setNoLien(null);
              setDefer(null);
              setCredit650(null);
              setIncomeDocs(null);
              setTaxAssess(null);
              setSellSoon(null);
              setShowResult(false);
            }}
          >
            Reset Quiz
          </button>
          <button
            type="button"
            className="btn btn-brand-blue btn-sm btn-press inline-flex items-center gap-2 w-full sm:w-auto"
            onClick={() => setShowResult(true)}
            aria-haspopup="dialog"
          >
            See likely fit <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {showResult && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
          {result ? (
            <p><span className="font-semibold">Likely fit:</span> {result}. We’ll confirm details and eligibility with a quick call.</p>
          ) : (
            <p className="text-slate-600">Answer a few questions, then click “See likely fit.”</p>
          )}
        </div>
      )}
    </div>
  );
}
