import ServicesQuickLinks from "./ServicesQuickLinks"
import TocFromHeadings from "./TocFromHeadings"
import SmartLink from "./SmartLink"
import { CalendarDays, ArrowRight, Zap, Phone } from "lucide-react"

const arrowIconStyles = "icon-affordance h-4 w-4 inline ml-2";
const semanticIconStyles = "h-4 w-4 inline mr-2";
const buttonStyles = "btn w-full h-11 mt-2";

export default function ServicesAside() {
    return (
        <aside className="sticky top-16 self-start h-fit lg:w-[320px]">
            <ServicesQuickLinks />

            <TocFromHeadings
                root="#article-root"
                offset={100}
                levels={[2]}
            />

            <div className="h-[1px] w-full bg-slate-200 my-4" />

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm not-prose">
                <h3 className="text-lg text-slate-900 text-center">Ready to get started?</h3>
                <SmartLink
                    href="/contact-us#book-an-appointment"
                    className={`${buttonStyles} btn-brand-blue`}
                    aria-label="Request a Free Roof Estimate"
                    data-icon-affordance="right"
                    proseGuard
                >
                    <CalendarDays className={semanticIconStyles} />
                    Get on the Schedule
                    <ArrowRight className={arrowIconStyles} />
                </SmartLink>
                <SmartLink
                    href="https://www.myquickroofquote.com/contractors/sonshine-roofing"
                    className={`${buttonStyles} btn-brand-orange`}
                    aria-label="Free 60-second Quote"
                    data-icon-affordance="right"
                    proseGuard
                >
                    <Zap className={semanticIconStyles} />
                    Free 60-second Quote
                    <ArrowRight className={arrowIconStyles} />
                </SmartLink>
                <SmartLink
                    href="tel:19418664320"
                    className={`${buttonStyles} btn-outline phone-affordance`}
                    aria-label="Call SonShine Roofing"
                    proseGuard
                >
                    <Phone className={`${semanticIconStyles} phone-affordance-icon`} />
                    (941) 866-4320
                </SmartLink>
            </div>
        </aside>
    )
}
