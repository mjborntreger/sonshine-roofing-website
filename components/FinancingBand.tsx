import { ArrowRight, HandCoins } from "lucide-react"
import UiLink from "./UiLink"

export default function FinancingBand() {
    return (
        <div className="my-6 rounded-xl bg-[#00e3fe]/10 border border-[#00e3fe]/30 p-4 not-prose">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="m-0 text-slate-800">
                    <strong>Prefer monthly payments?</strong> Explore our flexible financing options.
                </p>
                <UiLink 
                    href="/financing" 
                    className="btn btn-brand-blue h-11 px-5" 
                    aria-label="Explore financing options"
                    data-icon-affordance="right"
                    >
                        <HandCoins className="h-4 w-4 inline mr-2" />
                        Explore financing
                        <ArrowRight className="icon-affordance h-4 w-4 inline ml-2" />
                </UiLink>
            </div>
        </div>

    )
}
