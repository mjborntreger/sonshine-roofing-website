import { PencilLineIcon, SquareMenu, ArrowRight } from "lucide-react";
import SmartLink from "../utils/SmartLink";
import ShareWhatYouThink from "../engagement/ShareWhatYouThink";

// Style Constants //
const titleIcon = "h-5 w-5 inline mr-2 text-[--brand-blue]";
const icon = "h-4 w-4 inline";
const title = "text-lg font-semibold text-slate-900";
const cardBase = "mt-4 rounded-3xl border border-blue-200 bg-white p-5 shadow-sm hover:shadow-md transition";
const text = "mt-2 text-slate-600";

export default function SidebarCta() {

    return (
        <div className="mt-2">
            <div className="h-[1px] w-full bg-slate-200" />
            <div className={cardBase}>
                <h4 className={title}>
                    <PencilLineIcon className={titleIcon} />
                    Contact Us
                </h4>
                <div className={text}>
                    Send us a message and we’ll follow up.
                </div>
                <SmartLink
                    className="mt-3 w-full px-4 py-2 btn btn-sm btn-outline"
                    data-icon-affordance="right"
                    href="/contact-us#book-an-appointment"
                >
                    <SquareMenu className={`${icon} mr-2`} />
                    Contact Form
                    <ArrowRight className={`${icon} ml-2 icon-affordance`} />
                </SmartLink>
            </div>
            <ShareWhatYouThink />
        </div>

    )
}