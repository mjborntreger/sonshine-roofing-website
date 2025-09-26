import SmartLink from "@/components/SmartLink";
import Section from "@/components/layout/Section";
import { Clock, Tag, Users, Languages, CreditCard, Hammer, MapPin, BadgePercent, ChevronDown } from "lucide-react";

const h2Styles = "mb-8 text-3xl lg:text-5xl"
const pillarsGrid = "mt-6 grid grid-cols-1 gap-4 items-stretch";
const pStyles = "text-md list-disc pl-5 space-y-1 marker:text-slate-400";
const gradientDivider = "gradient-divider my-4";
const linkStyles = "text-[--brand-blue]"

const detailsStyles = "group not-prose rounded-xl border border-slate-400 bg-white";
const summaryStyles = "flex items-center justify-between cursor-pointer select-none p-4";

export async function HoursAndInformation() {
  return (
    <Section>
      <div id="hours-and-information" className="text-center">
        <h2 className={h2Styles}>Hours and Information</h2>
        <div className={gradientDivider} />
      </div>

      <div className={pillarsGrid}>

        {/* Hours */}
        <details open className={detailsStyles}>
          <summary className={summaryStyles}>
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg font-semibold">Business Hours</h3>
            </span>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="accordion-motion px-4 pb-4">
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

        {/* Service Areas */}
        <details className={detailsStyles}>
          <summary className={summaryStyles}>
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg font-semibold">Service Areas</h3>
            </span>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="accordion-motion px-4 pb-4">
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

        {/* Brands */}
        <details className={detailsStyles}>
          <summary className={summaryStyles}>
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
              <h3 className="m-0 text-lg font-semibold">Brands</h3>
            </span>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="accordion-motion px-4 pb-4">
            <ul className={pStyles}>
              <li>
                <SmartLink
                  href="https://www.gaf.com/en-us/roofing-materials/residential-roofing-materials/shingles#"
                  title="GAF"
                  aria-label="GAF"
                  className={linkStyles}
                  showExternalIcon
                >
                  GAF
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://eagleroofing.com/products/browse-tile/"
                  title="Eagle Tile"
                  aria-label="Eagle Tile"
                  className={linkStyles}
                  showExternalIcon
                >
                  Eagle Tile
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://westlakeroyalroofing.com/product-category/concrete/"
                  title="Westlake Royal Roofing"
                  aria-label="Westlake Royal Roofing"
                  className={linkStyles}
                  showExternalIcon
                >
                  Westlake Royal Roofing
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://www.crownrooftiles.com/signature_series_fl.html"
                  title="Crown Tile"
                  aria-label="Crown Tile"
                  className={linkStyles}
                  showExternalIcon
                >
                  Crown Tile
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://sunshinemetalsupply.com/metal-panels/"
                  title="Sunshine Metal Supply"
                  aria-label="Sunshine Metal Supply"
                  className={linkStyles}
                  showExternalIcon
                >
                  Sunshine Metal Supply
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://polyglass.us/roofing/"
                  title="Polyglass USA"
                  aria-label="Polyglass USA"
                  className={linkStyles}
                  showExternalIcon
                >
                  Polyglass USA
                </SmartLink>
              </li>
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
          <div className="accordion-motion px-4 pb-4">
            <ul className={pStyles}>
              <li>
                <SmartLink
                  href="https://www.gaf.com/en-us/roofing-contractors/residential/sonshine-roofing-inc-1104247"
                  title="GAF Factory Certified Master Elite"
                  aria-label="GAF Factory Certified Master Elite"
                  className={linkStyles}
                  showExternalIcon
                >
                  GAF Factory Certified Master Elite
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://business.sarasotachamber.com/active-member-directory/Details/sonshine-roofing-3821919"
                  title="Sarasota Chamber of Commerce"
                  aria-label="Sarasota Chamber of Commerce"
                  className={linkStyles}
                  showExternalIcon
                >
                  Sarasota Chamber of Commerce
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://business.manateechamber.com/list/member/sonshine-roofing-37287"
                  title="Manatee Chamber of Commerce"
                  aria-label="Manatee Chamber of Commerce"
                  className={linkStyles}
                  showExternalIcon
                >
                  Manatee Chamber of Commerce
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://www.northportareachamber.com/list/member/sonshine-roofing-inc-4041"
                  title="North Port Chamber of Commerce"
                  aria-label="North Port Chamber of Commerce"
                  className={linkStyles}
                  showExternalIcon
                >
                  North Port Chamber of Commerce
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://www.floridaroof.com/SONSHINE-ROOFING-INC-10-1104.html"
                  title="Florida Roofing and Sheet Metal Contractors' Association"
                  aria-label="Florida Roofing and Sheet Metal Contractors' Association"
                  className={linkStyles}
                  showExternalIcon
                >
                  Florida Roofing and Sheet Metal Contractors' Association
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://www.nrca.net/Members/Members/Detail/26f0eca5-8397-4524-8ea3-807a1735e028#"
                  title="National Roofing Contractors' Association"
                  aria-label="National Roofing Contractors' Association"
                  className={linkStyles}
                  showExternalIcon
                >
                  National Roofing Contractors' Association
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://www.bbb.org/us/fl/sarasota/profile/roofing-contractors/sonshine-roofing-inc-0653-6096353/#sealclick"
                  title="Better Business Bureau (A+)"
                  aria-label="Better Business Bureau (A+)"
                  className={linkStyles}
                  showExternalIcon
                >
                  Better Business Bureau (A+)
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="https://mysafeflhome.com/"
                  title="My Safe Florida Home Certified"
                  aria-label="My Safe Florida Home Certified"
                  className={linkStyles}
                  showExternalIcon
                >
                  My Safe Florida Home Certified
                </SmartLink>
              </li>
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
          <div className="accordion-motion px-4 pb-4">
            <ul className={pStyles}>
              <li>Visa</li>
              <li>MasterCard</li>
              <li>Discover</li>
              <li>American Express</li>
              <li>Cash</li>
              <li>Check</li>
              <li>Insurance</li>
              <li>
                <SmartLink
                  href="/financing"
                  aria-label="Home-secured Financing"
                  title="Home-secured Financing"
                  className={linkStyles}
                >
                  Home-secured Financing
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="/financing"
                  aria-label="Credit-based Financing"
                  title="Credit-based Financing"
                  className={linkStyles}
                >
                  Credit-based Financing
                </SmartLink>
              </li>
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
          <div className="accordion-motion px-4 pb-4">
            <ul className={pStyles}>
              <li>
                <SmartLink
                  href="/roof-replacement-sarasota-fl"
                  aria-label="Roof Replacement"
                  title="Roof Replacement"
                  className={linkStyles}
                >
                  Roof Replacement
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="/roof-repair"
                  aria-label="Roof Repair"
                  title="Roof Repair"
                  className={linkStyles}
                >
                  Roof Repair
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="/roof-inspection"
                  aria-label="Roof Inspection"
                  title="Roof Inspection"
                  className={linkStyles}
                >
                  Roof Inspection
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="/roof-inspection#tip-top-roof-checkup"
                  aria-label="Tip Top Roof Check-up"
                  title="Tip Top Roof Check-up"
                  className={linkStyles}
                >
                  Tip Top Roof Check-up
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="/roof-maintenance"
                  aria-label="Roof Maintenance"
                  title="Roof Maintenance"
                  className={linkStyles}
                >
                  Roof Maintenance
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="/roof-care-club#roof-care-club"
                  aria-label="Roof Care Club"
                  title="Roof Care Club"
                  className={linkStyles}
                >
                  Roof Care Club
                </SmartLink>
              </li>
              <li>Skylights</li>
              <li>Shingle Roofing</li>
              <li>Tile Roofing</li>
              <li>Metal Roofing</li>
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
          <div className="accordion-motion px-4 pb-4">
            <ul className={pStyles}>
              <li>English</li>
              <li>Spanish</li>
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
          <div className="accordion-motion px-4 pb-4">
            <ul className={pStyles}>
              <li>Veterans & Armed Forces</li>
              <li>First Responders</li>
              <li>Teachers</li>
              <li>Repeat Customers</li>
            </ul>
          </div>
        </details>
      </div>
    </Section>
  )
}
