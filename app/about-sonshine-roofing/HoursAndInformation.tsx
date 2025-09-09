import SmartLink from "@/components/SmartLink";
import Section from "@/components/layout/Section";
import { Clock, Tag, Users, Languages, CreditCard, Hammer, MapPin, BadgePercent, ChevronDown } from "lucide-react";

const h2Styles = "my-8"
const pillarsGrid = "mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch";
const pStyles = "mt-3 text-sm list-disc pl-5 space-y-1 marker:text-slate-400";
const gradientDivider = "gradient-divider my-4";

const detailsStyles = "group not-prose rounded-xl border border-slate-200 bg-white";
const summaryStyles = "flex items-center justify-between cursor-pointer select-none p-4";

const pillarsGridDesktop = "mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch hidden lg:grid";
const cardBase = "rounded-xl border border-slate-400 bg-white p-4 shadow-sm";
const cardHeader = "flex items-center gap-2 font-semibold text-slate-900";

export async function HoursAndInformation() {
    return (
      <Section>
        <div id="hours-and-information" className="text-center">
          <h2 className={h2Styles}>Hours and Information</h2>
          <div className={gradientDivider} />
        </div>

        <div className={`${pillarsGrid} lg:hidden`}>

          {/* Hours */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Business Hours</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <dl className="mt-2 grid grid-cols-[max-content_auto] gap-x-1 gap-y-2 text-sm text-slate-700">
                <dt className="text-slate-600">Monday</dt>
                <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
                <dt className="text-slate-600">Tuesday</dt>
                <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
                <dt className="text-slate-600">Wednesday</dt>
                <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
                <dt className="text-slate-600">Thursday</dt>
                <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
                <dt className="text-slate-600">Friday</dt>
                <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
                <dt className="text-slate-600">Saturday</dt>
                <dd className="text-right text-slate-600">Closed</dd>
                <dt className="text-slate-600">Sunday</dt>
                <dd className="text-right text-slate-600">Closed</dd>
              </dl>
            </div>
          </details>

          {/* Brands */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Brands</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <ul className={pStyles}>
                <li>GAF</li>
                <li>Eagle Tile</li>
                <li>Westlake Royal Roofing</li>
                <li>Crown Tile</li>
                <li>Sunshine Metal Supply</li>
                <li>Polyglass USA</li>
              </ul>
            </div>
          </details>

          {/* Associations */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Associations</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <ul className={pStyles}>
                <li>GAF Factory Certified Master Elite</li>
                <li>Sarasota Chamber of Commerce</li>
                <li>Manatee Chamber of Commerce</li>
                <li>North Port Chamber of Commerce</li>
                <li>Florida Roofing and Sheet Metal Contractors' Association</li>
                <li>National Roofing Contractors' Association</li>
                <li>Better Business Bureau (A+)</li>
                <li>My Safe Florida Home Certified</li>
              </ul>
            </div>
          </details>

          {/* Languages */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Languages</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <ul className={pStyles}>
                <li>English</li>
                <li>Spanish</li>
              </ul>
            </div>
          </details>

          {/* Payment Types */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Payment Types</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <ul className={pStyles}>
                <li>Visa</li>
                <li>MasterCard</li>
                <li>Discover</li>
                <li>American Express</li>
                <li>Cash</li>
                <li>Check</li>
                <li>Insurance</li>
                <li>Home-secured Financing</li>
                <li>Credit-based Financing</li>
              </ul>
            </div>
          </details>

          {/* Roofing Services */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <Hammer className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Roofing Services</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <ul className={pStyles}>
                <li>Roof Replacement</li>
                <li>Roof Repair</li>
                <li>Roof Inspection</li>
                <li>Roof Maintenance</li>
                <li>Roof Care Club</li>
                <li>Skylights</li>
                <li>Shingle Roofing</li>
                <li>Tile Roofing</li>
                <li>Metal Roofing</li>
              </ul>
            </div>
          </details>

          {/* Service Areas */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Service Areas</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <ul className={pStyles}>
                <li>Sarasota</li>
                <li>Bradenton</li>
                <li>Palmetto</li>
                <li>Parrish</li>
                <li>Myakka Ciy</li>
                <li>Venice</li>
                <li>Nokomis</li>
                <li>North Port</li>
                <li>Port Charlotte</li>
                <li>Punta Gorda</li>
                <li>Englewood</li>
                <li>Myakka City</li>
              </ul>
            </div>
          </details>

          {/* Discounts */}
          <details className={detailsStyles}>
            <summary className={summaryStyles}>
              <span className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                <h3 className="m-0 text-lg font-semibold">Discounts</h3>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <ul className={pStyles}>
                <li>Veterans & Armed Forces</li>
                <li>First Responders</li>
                <li>Teachers</li>
                <li>Repeat Customers</li>
              </ul>
            </div>
          </details>
        </div>

        {/* Desktop cards (visible ≥ lg) */}
        <div className={pillarsGridDesktop}>
          {/* Hours */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <Clock className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Business Hours</h3>
            </div>
            <dl className="mt-3 grid grid-cols-[max-content_auto] gap-x-1 gap-y-2 text-sm text-slate-700">
              <dt className="text-slate-600">Monday</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Tuesday</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Wednesday</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Thursday</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Friday</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Saturday</dt>
              <dd className="text-right text-slate-600">Closed</dd>
              <dt className="text-slate-600">Sunday</dt>
              <dd className="text-right text-slate-600">Closed</dd>
            </dl>
          </div>

          {/* Brands */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <Tag className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Brands</h3>
            </div>
            <ul className={pStyles}>
              <li>GAF</li>
              <li>Eagle Tile</li>
              <li>Westlake Royal Roofing</li>
              <li>Crown Tile</li>
              <li>Sunshine Metal Supply</li>
              <li>Polyglass USA</li>
            </ul>
          </div>

          {/* Associations */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <Users className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Associations</h3>
            </div>
            <ul className={pStyles}>
              <li>GAF Factory Certified Master Elite</li>
              <li>Sarasota Chamber of Commerce</li>
              <li>Manatee Chamber of Commerce</li>
              <li>North Port Chamber of Commerce</li>
              <li>Florida Roofing and Sheet Metal Contractors' Association</li>
              <li>National Roofing Contractors' Association</li>
              <li>Better Business Bureau (A+)</li>
              <li>My Safe Florida Home Certified</li>
            </ul>
          </div>

          {/* Languages */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <Languages className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Languages</h3>
            </div>
            <ul className={pStyles}>
              <li>English</li>
              <li>Spanish</li>
            </ul>
          </div>

          {/* Payment Types */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <CreditCard className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Payment Types</h3>
            </div>
            <ul className={pStyles}>
              <li>Visa</li>
              <li>MasterCard</li>
              <li>Discover</li>
              <li>American Express</li>
              <li>Cash</li>
              <li>Check</li>
              <li>Insurance</li>
              <li>Home-secured Financing</li>
              <li>Credit-based Financing</li>
            </ul>
          </div>

          {/* Roofing Services */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <Hammer className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Roofing Services</h3>
            </div>
            <ul className={pStyles}>
              <li>Roof Replacement</li>
              <li>Roof Repair</li>
              <li>Roof Inspection</li>
              <li>Roof Maintenance</li>
              <li>Roof Care Club</li>
              <li>Skylights</li>
              <li>Shingle Roofing</li>
              <li>Tile Roofing</li>
              <li>Metal Roofing</li>
            </ul>
          </div>

          {/* Service Areas */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <MapPin className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Service Areas</h3>
            </div>
            <ul className={pStyles}>
              <li>Sarasota</li>
              <li>Bradenton</li>
              <li>Palmetto</li>
              <li>Parrish</li>
              <li>Myakka Ciy</li>
              <li>Venice</li>
              <li>Nokomis</li>
              <li>North Port</li>
              <li>Port Charlotte</li>
              <li>Punta Gorda</li>
              <li>Englewood</li>
              <li>Myakka City</li>
            </ul>
          </div>

          {/* Discounts */}
          <div className={cardBase}>
            <div className={cardHeader}>
              <BadgePercent className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg">Discounts</h3>
            </div>
            <ul className={pStyles}>
              <li>Veterans & Armed Forces</li>
              <li>First Responders</li>
              <li>Teachers</li>
              <li>Repeat Customers</li>
            </ul>
          </div>
        </div>
      </Section>
    )
}