import SmartLink from "@/components/utils/SmartLink";
import { Accordion } from "@/components/ui/Accordion";
import { Clock, Tag, Users, Languages, CreditCard, Hammer, MapPin, BadgePercent, ArrowDown } from "lucide-react";

const h2Styles = "mb-8 text-4xl"
const pillarsGrid = "mt-6 grid grid-cols-1 gap-4 items-stretch";
const pStyles = "text-md list-disc pl-5 space-y-1 marker:text-slate-400";
const linkStyles = "text-[--brand-blue] icon-affordance"

export async function HoursAndInformation() {
  return (
    <div>
      <div id="hours-and-information">
        <h2 
          className={h2Styles}
          >
            Hours and Information
            <ArrowDown className="h-8 w-8 inline ml-2 text-[--brand-blue]" />
        </h2>
      </div>

      <div className={pillarsGrid}>

        {/* Hours */}
        <Accordion
          icon={<Clock className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-2xl">Business Hours</h3>}
          radius="2xl"
          proseBody={false}
          defaultOpen
        >
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
        </Accordion>

        {/* Service Areas */}
        <Accordion
          icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-lg">Service Areas</h3>}
          radius="2xl"
          proseBody={false}
          
        >
          <ul className={pStyles}>
            <li>
              <SmartLink href="/locations/sarasota" title="Sarasota, FL Service Area">
                Sarasota, FL
              </SmartLink>
            </li>
            <li>
              <SmartLink href="/locations/venice" title="Venice, FL Service Area">
                Venice, FL
              </SmartLink>
            </li>
            <li>
              <SmartLink href="/locations/north-port" title="North Port, FL Service Area">
                North Port, FL
              </SmartLink>
            </li>
            <li>
              <SmartLink href="/locations/lakewood-ranch" title="Lakewood Ranch, FL Service Area">
                Lakewood Ranch, FL
              </SmartLink>
            </li>
            <li>Bradenton, FL</li>
            <li>Palmetto, FL</li>
            <li>Parrish, FL</li>
            <li>Nokomis, FL</li>
            <li>Port Charlotte, FL</li>
            <li>Punta Gorda, FL</li>
            <li>Englewood, FL</li>
            <li>Myakka City, FL</li>
          </ul>
        </Accordion>

        {/* Brands */}
        <Accordion
          icon={<Tag className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-lg">Brands</h3>}
          radius="2xl"
          proseBody={false}
          
        >
          <ul className={pStyles}>
            <li>
              <SmartLink
                href="https://www.gaf.com/en-us/roofing-materials/residential-roofing-materials/shingles#"
                title="GAF"
                aria-label="GAF"
                className={linkStyles}
                showExternalIcon
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
              >
                Polyglass USA
              </SmartLink>
            </li>
          </ul>
        </Accordion>

        {/* Associations */}
        <Accordion
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-lg">Associations</h3>}
          radius="2xl"
          proseBody={false}
          
        >
          <ul className={pStyles}>
            <li>
              <SmartLink
                href="https://www.gaf.com/en-us/roofing-contractors/residential/sonshine-roofing-inc-1104247"
                title="GAF Factory Certified Master Elite"
                aria-label="GAF Factory Certified Master Elite"
                className={linkStyles}
                showExternalIcon
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
              >
                North Port Chamber of Commerce
              </SmartLink>
            </li>
            <li>
              <SmartLink
                href="https://www.floridaroof.com/SONSHINE-ROOFING-INC-10-1104.html"
                title="Florida Roofing and Sheet Metal Contractors&rsquo; Association"
                aria-label="Florida Roofing and Sheet Metal Contractors&rsquo; Association"
                className={linkStyles}
                showExternalIcon
                data-icon-affordance="up-right"
              >
                Florida Roofing and Sheet Metal Contractors&rsquo; Association
              </SmartLink>
            </li>
            <li>
              <SmartLink
                href="https://www.nrca.net/Members/Members/Detail/26f0eca5-8397-4524-8ea3-807a1735e028#"
                title="National Roofing Contractors&rsquo; Association"
                aria-label="National Roofing Contractors&rsquo; Association"
                className={linkStyles}
                showExternalIcon
                data-icon-affordance="up-right"
              >
                National Roofing Contractors&rsquo; Association
              </SmartLink>
            </li>
            <li>
              <SmartLink
                href="https://www.bbb.org/us/fl/sarasota/profile/roofing-contractors/sonshine-roofing-inc-0653-6096353/#sealclick"
                title="Better Business Bureau (A+)"
                aria-label="Better Business Bureau (A+)"
                className={linkStyles}
                showExternalIcon
                data-icon-affordance="up-right"
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
                data-icon-affordance="up-right"
              >
                My Safe Florida Home Certified
              </SmartLink>
            </li>
          </ul>
        </Accordion>

        {/* Payment Types */}
        <Accordion
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-lg">Payment Types</h3>}
          radius="2xl"
          proseBody={false}
          
        >
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
        </Accordion>

        {/* Roofing Services */}
        <Accordion
          icon={<Hammer className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-lg">Roofing Services</h3>}
          radius="2xl"
          proseBody={false}
          
        >
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
        </Accordion>

        {/* Languages */}
        <Accordion
          icon={<Languages className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-lg">Languages</h3>}
          radius="2xl"
          proseBody={false}
          
        >
          <ul className={pStyles}>
            <li>English</li>
            <li>Spanish</li>
          </ul>
        </Accordion>

        {/* Discounts */}
        <Accordion
          icon={<BadgePercent className="h-5 w-5" aria-hidden="true" />}
          summary={<h3 className="text-lg">Discounts</h3>}
          radius="2xl"
          proseBody={false}
          
        >
          <ul className={pStyles}>
            <li>Veterans & Armed Forces</li>
            <li>First Responders</li>
            <li>Teachers</li>
            <li>Repeat Customers</li>
          </ul>
        </Accordion>
      </div>
    </div>
  )
}
