import StaticImage from '@/components/media/StaticImage';
import SmartLink from '@/components/utils/SmartLink';

const providers = [
  {
    name: 'Ygrene',
    logo: 'static:ygrene-logo',
    type: 'Property-based PACE financing',
    description:
      'Eligible roof improvements can be financed through a voluntary property-tax assessment.',
    points: [
      'Repayment is collected with your property taxes. If you use mortgage escrow, the assessment can increase that payment.',
      'Your property secures the financing through a first-priority lien, ahead of a mortgage.',
      'Eligibility depends on your property location, home equity, ability to repay and other provider requirements. Ygrene uses a soft credit inquiry.',
    ],
    source: 'https://ygrene.com/how-it-works/',
    sourceLabel: 'How Ygrene financing works',
    cta: 'Ask SonShine about Ygrene',
  },
  {
    name: 'Service Finance',
    logo: 'static:service-finance-logo',
    type: 'Home improvement installment financing',
    description:
      'Roofing financing is offered through participating contractors for a fixed financed amount and term.',
    points: [
      'Repay the loan through installments under the agreement you choose.',
      'Available programs and terms are provided through the contractor. Review the financing documents for costs, payment terms and any security requirements.',
      'Financing requires a separate application and lender approval. Your available options depend on the provider’s requirements.',
    ],
    source: 'https://www.svcfin.com/faqs',
    sourceLabel: 'Service Finance program information',
    cta: 'Ask SonShine about Service Finance',
  },
] as const;

/** General provider information checked against the linked official sources on 2026-10-20. */
export default function FinancingProviders() {
  return (
    <>
      <p className="mb-6 max-w-3xl text-base leading-relaxed text-slate-600">
        SonShine is your roofing contractor. We can explain the next steps for either provider after
        learning about your roof. The provider determines eligibility, approval and financing terms.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {providers.map((provider) => (
          <article
            key={provider.name}
            className="flex min-w-0 flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-6 flex h-16 items-center">
              <StaticImage
                src={provider.logo}
                alt={`${provider.name} logo`}
                width={240}
                height={64}
                sizes="240px"
                className="h-16 w-auto max-w-full object-contain object-left"
              />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900">{provider.name}</h3>
            <p className="mt-2 font-semibold text-[--brand-blue]">{provider.type}</p>
            <p className="mt-4 leading-relaxed text-slate-600">{provider.description}</p>
            <ul className="mt-5 list-disc space-y-3 pl-5 leading-relaxed text-slate-700">
              {provider.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <SmartLink
                href={provider.source}
                className="text-sm text-[--brand-blue] underline underline-offset-4"
                showExternalIcon
              >
                {provider.sourceLabel}
              </SmartLink>
              <SmartLink
                href="#book-an-appointment"
                className="btn btn-brand-blue mt-6 min-h-12 w-full whitespace-normal px-4 py-3 text-center text-base"
                proseGuard
              >
                {provider.cta}
              </SmartLink>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 text-sm leading-relaxed text-slate-600">
        Availability and terms vary. Compare the full cost, payment schedule and obligations before
        signing. Requesting an estimate here does not submit a financing application or authorize a
        credit inquiry.
      </p>
    </>
  );
}
