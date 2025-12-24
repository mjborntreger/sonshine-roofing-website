import { ArrowRight, CalendarDays, Phone } from "lucide-react";
import SmartLink from "../utils/SmartLink";
import OpenOrClosed from "../utils/OpenOrClosed";
import CopyButton from "../utils/CopyButton";

// Style Constants //
const arrowIconStyles = "icon-affordance h-4 w-4 inline ml-2";
const semanticIconStyles = "h-4 w-4 inline mr-2";
const buttonStyles = "btn w-full btn-lg mt-2";

export default function SidebarCta() {

    return (
        <div className="mt-4 rounded-3xl border border-blue-200 bg-white p-4 shadow-sm not-prose">
            <OpenOrClosed
                holidayClosures={['2026-11-26', '2026-11-27']}
                recurringClosures={['12-24', '12-25', '12-26', '07-04']}
            />
            <SmartLink
                href="/contact-us#book-an-appointment"
                className={`${buttonStyles} btn-brand-blue`}
                aria-label="Contact Us"
                data-icon-affordance="right"
                proseGuard
            >
                <CalendarDays className={semanticIconStyles} />
                Contact Form
                <ArrowRight className={arrowIconStyles} />
            </SmartLink>
            <div className="flex flex-row justify-between gap-2">
                <SmartLink
                    href="tel:19418664320"
                    className={`${buttonStyles} btn-outline phone-affordance`}
                    aria-label="Call SonShine Roofing"
                    proseGuard
                >
                    <Phone className={`${semanticIconStyles} phone-affordance-icon`} />
                    (941) 866-4320
                </SmartLink>
                <CopyButton className="mt-2" copyContent="+19418664320" ariaLabel="Copy phone number" />
            </div>
        </div>

    )
}
