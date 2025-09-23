export type FinancingProgram = {
  id: string;
  label: string;
  apr: number; // annual percentage rate in decimal form (e.g., 0.079)
  termMonths: number;
  summary?: string;
  footnote?: string;
};

export const FINANCING_PROGRAMS: FinancingProgram[] = [
  {
    id: "same-as-cash-12",
    label: "12-Month Same-As-Cash",
    apr: 0,
    termMonths: 12,
    summary: "0% promotional period estimate",
  },
  {
    id: "term-10yr-999",
    label: "10-Year Fixed @ 9.99%",
    apr: 0.0999,
    termMonths: 120,
    summary: "Service Finance fixed-rate option",
  },
  {
    id: "term-15yr-79",
    label: "15-Year Fixed @ 7.9%",
    apr: 0.079,
    termMonths: 180,
    summary: "Service Finance extended term",
    footnote: "≈ $96 per $10k",
  },
  {
    id: "ygrene-15yr-849",
    label: "YGrene • 15-Year @ 8.49%",
    apr: 0.0849,
    termMonths: 180,
    summary: "Typical post-deferral YGrene payment",
    footnote: "≈ $124 per $10k",
  },
];

export const FINANCING_PRESETS = [8000, 15000, 25000, 40000, 60000];

export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  const amount = Math.max(1000, Math.round(Number.isFinite(principal) ? principal : 0));
  const rate = annualRate / 12;
  if (rate === 0) return amount / months;
  return (amount * rate) / (1 - Math.pow(1 + rate, -months));
}
