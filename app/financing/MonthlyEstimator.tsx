// MonthlyEstimator — styled panel with icon header
'use client';

import { useId, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

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
  // Icon style for this panel header (tweak here)
  const panelIcon = 'inline mr-2 h-6 w-6 text-[--brand-blue]';

  const values = useMemo(() => {
    const a = Math.max(1000, Math.round(amount || 0));
    return {
      sameAsCash12: a / 12,                          // 12-month 0% promo (estimate)
      term10yr999: pmt(a, 0.0999, 120),              // 10-year @ 9.99%
      term15yr79:  pmt(a, 0.079,  180),              // 15-year @ 7.9%
      ygrene15yr849: pmt(a, 0.0849, 180),            // YGrene rough comp: 8.49% over 15yr (post-deferral)
    };
  }, [amount]);

  const presets = [8000, 15000, 25000, 40000, 60000];

  return (
    <div id="estimator" className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
      <div className="mb-8 text-2xl text-center font-semibold text-slate-900">
        <Calculator className={panelIcon} aria-hidden="true" />
        Monthly Payment Calculator
      </div>

      <label htmlFor={inputId} className="mb-3 block text-sm text-slate-700">Estimated project total</label>
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-flex h-10 items-center rounded-lg bg-emerald-500 px-3 text-white">$</span>
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
      <div className="my-3 flex flex-wrap gap-2 text-sm">
        {presets.map((v) => {
          const selected = amount === v;
          return (
            <button
              key={v}
              type="button"
              className={
                `rounded-full px-3 py-1 transition border focus:outline-none focus:ring-2 focus:ring-offset-2 ` +
                (selected
                  ? 'bg-[--brand-blue] text-white border-[--brand-blue]'
                  : 'border-slate-200 hover:bg-slate-50')
              }
              onClick={() => setAmount(v)}
              aria-label={`Set amount to ${currency(v)}`}
              aria-pressed={selected}
            >
              {currency(v).replace('.00', '')}
            </button>
          );
        })}
      </div>

      {/* Tip */}
      <div className="mb-2 mt-5 text-center text-slate-700 text-sm block">
        Estimated Monthly Payment
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
              <td className="p-3 font-medium">YGrene (8.49% • est. after deferral)</td>
              <td className="p-3 text-right">{currency(values.ygrene15yr849)}/mo</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="italic mt-2 text-xs text-slate-500">
        Estimates only. Not a credit offer. Promo terms, deferral windows, and final payments are set by the lender.
      </p>
    </div>
  );
}
