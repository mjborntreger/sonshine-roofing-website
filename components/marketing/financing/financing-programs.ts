type FinancingProgram = {
  id: string;
  label: string;
  annualInterestRate: number; // decimal interest rate; excludes fees and is not APR
  termMonths: number;
  summary?: string;
  footnote?: string;
};

// Verified 2026-10-22 against ygrene.com, ygrene.com/faq/ and svcfin.com/faqs.
// Service Finance rates/promotions are SonShine's existing program examples;
// the provider's public FAQ does not confirm their current availability.
export const FINANCING_TERMS = {
  ygrene: {
    annualInterestRate: 0.0849,
    rateLabel: '8.49%',
    maxFirstPaymentDelayMonths: 17,
    eligibility: [
      'At least 10% home equity and sufficient income to meet Ygrene’s ability-to-repay requirements.',
      'Property taxes paid current for at least the past three years, with mortgage payments current.',
      'Bankruptcy history is reviewed over five years, with exceptions for discharged cases and a two-year timeframe for dismissed cases.',
      'All owners on the property title must apply. Property and program restrictions also apply; Ygrene confirms final eligibility.',
    ],
    disclosure:
      'Interest accrues after funding, including before payments begin. The rate shown is Ygrene’s calculator illustration. Confirm your actual rate, APR, fees and total cost in the financing documents.',
  },
  serviceFinance: {
    annualInterestRate: 0.079,
    rateLabel: '7.9%',
    promotionMonths: 12,
    eligibility: [
      'Basic identity details and a separate credit application, subject to lender approval.',
      'An estimated project total to establish the amount you want to finance.',
      'Income and employment information for the lender’s review.',
    ],
    disclosure:
      'Ask which programs are currently available and confirm the APR and full terms. No-interest and deferred-interest offers differ: a deferred-interest offer may charge accrued interest if its payoff conditions are not met.',
  },
} as const;

export const FINANCING_PROGRAMS: FinancingProgram[] = [
  {
    id: "same-as-cash-12",
    label: `${FINANCING_TERMS.serviceFinance.promotionMonths}-Month Promotional Example`,
    annualInterestRate: 0,
    termMonths: FINANCING_TERMS.serviceFinance.promotionMonths,
    summary: "Amount to pay off principal within the promotion; confirm the offer’s conditions",
  },
  {
    id: "term-10yr-999",
    label: "10-Year Fixed @ 9.99%",
    annualInterestRate: 0.0999,
    termMonths: 120,
    summary: "Service Finance illustration; confirm current availability and APR",
  },
  {
    id: "term-15yr-79",
    label: `15-Year Fixed @ ${FINANCING_TERMS.serviceFinance.rateLabel}`,
    annualInterestRate: FINANCING_TERMS.serviceFinance.annualInterestRate,
    termMonths: 180,
    summary: "Service Finance illustration; confirm current availability and APR",
    footnote: `≈ $${Math.round(monthlyPayment(10000, FINANCING_TERMS.serviceFinance.annualInterestRate, 180))} per $10k`,
  },
  {
    id: "ygrene-15yr-849",
    label: `YGrene • 15-Year @ ${FINANCING_TERMS.ygrene.rateLabel}`,
    annualInterestRate: FINANCING_TERMS.ygrene.annualInterestRate,
    termMonths: 180,
    summary: "Illustrative monthly equivalent; actual property-tax payment schedule differs",
    footnote: `≈ $${Math.round(monthlyPayment(10000, FINANCING_TERMS.ygrene.annualInterestRate, 180))} per $10k`,
  },
];

export const FINANCING_PRESETS = [8000, 15000, 25000, 40000, 60000];

export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  const amount = Math.max(1000, Math.round(Number.isFinite(principal) ? principal : 0));
  const rate = annualRate / 12;
  if (rate === 0) return amount / months;
  return (amount * rate) / (1 - Math.pow(1 + rate, -months));
}
