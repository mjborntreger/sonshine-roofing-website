import SmartLink from "./SmartLink";
import { ShieldCheck, Shield, MapPin, HandCoins, ChevronDown, Award, CalendarDays, BadgeCheck, Star, Banknote } from "lucide-react";

const pillarsGrid = "mt-8 grid grid-cols-2 gap-5 items-start auto-rows-fr";
const detailsBase = "group h-full flex flex-col rounded-2xl border border-slate-400 bg-white p-8 shadow-lg transition hover:shadow-md hover:-translate-y-0.5";
const detailsPosition = "inline-flex items-center gap-3";
const detailsSummary = "flex cursor-pointer text-lg select-none items-center justify-between gap-3 text-slate-900";
const iconChip = "grid h-9 w-9 place-items-center rounded-full text-[--brand-blue] bg-[[--brand-blue]]/10 ring-1 ring-[[--brand-blue]]/20 transition-transform group-hover:scale-105";
const titleAccent = "font-semibold relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[[--brand-orange]] after:to-[#00e3fe] after:transition-all group-hover:after:w-12";
const gradientDivider = "gradient-divider my-8";
const pStyles = "text-slate-700 mt-4";
const pillStyles = "badge badge--accent";

export default async function WhyHomeownersChooseUs() {
  return (
    <div className="mt-6 px-2">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl text-slate-700">Why Homeowners Choose Us</h2>
        <div className={gradientDivider} />
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
          <span className={`${pillStyles} inline-flex items-center gap-2`}>
            <Award className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            GAF Master Elite Certified
          </span>
          <span className={`${pillStyles} inline-flex items-center gap-2`}>
            <CalendarDays className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            38+ Years
          </span>
          <span className={`${pillStyles} inline-flex items-center gap-2`}>
            <BadgeCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            A+ Rated with the BBB
          </span>
          <span className={`${pillStyles} inline-flex items-center gap-2`}>
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            4.8 on Google
          </span>
          <span className={`${pillStyles} inline-flex items-center gap-2`}>
            <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            Licensed and Insured
          </span>
          <span className={`${pillStyles} inline-flex items-center gap-2`}>
            <BadgeCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            Warranty
          </span>
          <span className={`${pillStyles} inline-flex items-center gap-2`}>
            <Banknote className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            Financing
          </span>
        </div>
      </div>

      {/* Mobile / Tablet: Accordion toggles */}
      <div className="md:hidden my-8 space-y-3">
        {/* Local Expertise */}
        <details className={`${detailsBase} hover:ring-1 hover:ring-[#00e3fe4d]`}>
          <summary className={detailsSummary}>
            <span className={detailsPosition}>
              <span className={iconChip}>
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={titleAccent}>Local Expertise</span>
            </span>
            <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div>
            <p className={pStyles}>
              We're not some out-of-town outfit. We know the codes,
              the weather, the quirks of Florida homes—and how to roof them right.
            </p>
          </div>
        </details>

        {/* Quality Craftsmanship */}
        <details className={`${detailsBase} hover:ring-1 hover:ring-[#00e3fe4d]`}>
          <summary className={`${detailsSummary}`}>
            <span className={detailsPosition}>
              <span className={iconChip}>
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={titleAccent}>Quality Craftsmanship</span>
            </span>
            <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div>
            <p className={pStyles}>
              Our crews don’t cut corners. Every shingle, every nail, every detail is done with pride, precision, and care. 100% of our work is done by our crews—not subcontractors—and we back it with industry‑leading warranties.
            </p>
          </div>
        </details>

        {/* Durable Materials */}
        <details className={`${detailsBase} hover:ring-1 hover:ring-[#00e3fe4d]`}>
          <summary className={`${detailsSummary}`}>
            <span className={detailsPosition}>
              <span className={iconChip}>
                <Shield className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={titleAccent}>Durable Materials</span>
            </span>
            <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div>
            <p className={pStyles}>
              Salty air, blistering heat, and devastating storms? We use materials tough enough to take it all. As a certified GAF Master Elite roofer, we have the materials and know-how to give you the most durable and energy-efficient roof you'll ever buy.
            </p>
          </div>
        </details>

        {/* Flexible Financing */}
        <details open className={detailsBase}>
          <summary className={detailsSummary}>
            <span className={detailsPosition}>
              <span className={iconChip}>
                <HandCoins className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={titleAccent}>Flexible Financing</span>
            </span>
            <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div>
            <p className={pStyles}>
              Low-interest home-secured and credit-based plans—see your options in minutes. No obligation.
            </p>
            <div className="mt-4">
              <SmartLink
                href="/financing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-brand-orange btn-md btn-press mt-2"
                title="Get started with financing"
              >
                Get started
              </SmartLink>
            </div>
          </div>
        </details>
      </div>

      {/* Desktop: original grid cards */}
      <div className={`${pillarsGrid} hidden md:grid`}>
        {/* Local Expertise */}
        <div className={detailsBase}>
          <div className={detailsSummary}>
            <span className={detailsPosition}>
              <span className={iconChip}><MapPin className="h-5 w-5" aria-hidden="true" /></span>
              <span className={titleAccent}>Local Expertise</span>
            </span>
          </div>
          <p className={pStyles}>
            We're not some out-of-town outfit. We know the codes,
            the weather, the quirks of Florida homes—and how to roof them right.
          </p>
        </div>

        {/* Quality Craftsmanship */}
        <div className={detailsBase}>
          <div className={detailsSummary}>
            <span className={detailsPosition}>
              <span className={iconChip}><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
              <span className={titleAccent}>Quality Craftsmanship</span>
            </span>
          </div>
          <p className={pStyles}>Our crews don’t cut corners. Every shingle, every nail, every detail is done with pride, precision, and care. 100% of our work is done by our crews—not subcontractors—and we back it with industry‑leading warranties.</p>
        </div>

        {/* Durable Materials */}
        <div className={detailsBase}>
          <div className={detailsSummary}>
            <span className={detailsPosition}>
              <span className={iconChip}><Shield className="h-5 w-5" aria-hidden="true" /></span>
              <span className={titleAccent}>Durable Materials</span>
            </span>
          </div>
          <p className={pStyles}>Salty air, blistering heat, and devastating storms? We use materials tough enough to take it all. As a certified GAF Master Elite roofer, we have the materials and know-how to give you the most durable and energy-efficient roof you'll ever buy.</p>
        </div>

        {/* Flexible Financing */}
        <div className={detailsBase}>
          <div className={detailsSummary}>
            <span className={detailsPosition}><span className={iconChip}><HandCoins className="h-5 w-5" aria-hidden="true" /></span><span className={titleAccent}>Flexible Financing</span></span>
          </div>
          <p className={pStyles}>Low-interest home-secured and credit-based plans—see your options in minutes. No obligation.</p>
          <div className="mt-4 md:mt-auto">
            <SmartLink
              href="/financing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-brand-orange btn-md btn-press mt-2"
              title="Get started with financing"
            >
              Get started
            </SmartLink>
          </div>
        </div>
      </div>
    </div>
  );
}