'use client';

import { useId, useMemo, useState } from 'react';

function currency(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pmt(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export default function MonthlyEstimator({
  defaultAmount = 15000,
}: { defaultAmount?: number }) {
  const inputId = useId();
  const [amount, setAmount] = useState<number>(defaultAmount);

  const values = useMemo(() => {
    const a = Math.max(1000, Math.round(amount || 0));
    return {
      sameAsCash12: a / 12,                          // 12-month 0% promo (estimate)
      term10yr999: pmt(a, 0.0999, 120),              // 10-year @ 9.99%
      term15yr79:  pmt(a, 0.079,  180),              // 15-year @ 7.9%
      ygrene15yr89: pmt(a, 0.089, 180),              // YGrene rough comp: 8.9% over 15yr (post-deferral)
    };
  }, [amount]);

  const presets = [8000, 15000, 25000, 40000];

  return (
    <div id="estimator" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-900">Monthly payment estimator</div>

      <label htmlFor={inputId} className="block text-sm text-slate-700">Estimated project total</label>
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-flex h-10 items-center rounded-lg bg-slate-50 px-3 text-slate-500">$</span>
        <input
          id={inputId}
          inputMode="numeric"
          pattern="[0-9]*"
          className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-[#0045d7]"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
          min={1000}
          step={500}
        />
      </div>

      {/* Quick presets */}
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {presets.map((v) => (
          <button
            key={v}
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 transition hover:bg-slate-50"
            onClick={() => setAmount(v)}
            aria-label={`Set amount to ${currency(v)}`}
          >
            {currency(v).replace('.00', '')}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <tbody className="[&>tr:nth-child(odd)]:bg-slate-50/40">
            <tr>
              <td className="p-3 font-medium">12-Month Same-As-Cash</td>
              <td className="p-3 text-right">{currency(values.sameAsCash12)}/mo</td>
            </tr>
            <tr>
              <td className="p-3 font-medium">10-Year @ 9.99%</td>
              <td className="p-3 text-right">{currency(values.term10yr999)}/mo</td>
            </tr>
            <tr>
              <td className="p-3 font-medium">15-Year @ 7.9%</td>
              <td className="p-3 text-right">{currency(values.term15yr79)}/mo <span className="text-slate-500">≈ $96 per $10k</span></td>
            </tr>
            <tr>
              <td className="p-3 font-medium">YGrene (8.9% • est. after deferral)</td>
              <td className="p-3 text-right">{currency(values.ygrene15yr89)}/mo</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Estimates only. Not a credit offer. Promo terms, deferral windows, and final payments are set by the lender.
      </p>
    </div>
  );
}