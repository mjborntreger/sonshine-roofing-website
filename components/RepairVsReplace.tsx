import { Hammer, ChevronDown, House } from "lucide-react";

const scrollGuard = "scroll-mt-24";
const detailsStyles = "group not-prose rounded-lg border border-slate-300 bg-white";
const summaryStyles = "flex items-center justify-between cursor-pointer select-none p-3";
const chevronStyles = "h-5 w-5 transition-transform group-open:rotate-180";
const iconStyles = "h-5 w-5 text-[--brand-blue]";
const pStyles = "prose px-4 pb-4 pt-0";


export default async function RepairVsReplace() {
    return (
        <>
            <h2 className={`${scrollGuard} text-center`}>Repair vs. Replace</h2>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-400 bg-white p-4">
                    <span className="flex items-center gap-2">
                        <Hammer className={iconStyles} aria-hidden="true" />
                        <h3 className="m-0">When Repair Makes Sense</h3>
                    </span>
                    <div className="mt-2 space-y-2">
                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">The damage is localized</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    A few missing shingles, a small leak, or minor flashing issues can often be fixed
                                    without needing a full tear-off.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">The roof is relatively new</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    If your roof is under 10–12 years old and generally in good shape, targeted repairs can
                                    extend its life without breaking the bank.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">You’re not seeing recurring issues</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    If this is your first leak or concern—and not part of a pattern—repairing the trouble
                                    spot may be all that’s needed.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">Your budget is tight (but the roof still has life)</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    Repairs can be a cost-effective short-term solution when full replacement isn’t
                                    financially feasible—just know it’s a Band-Aid, not a cure-all.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">You need to buy time for other priorities</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    Selling soon? Planning a full remodel later? Repairs can bridge the gap while
                                    keeping your home protected and insurable.
                                </p>
                            </div>
                        </details>
                    </div>
                </div>
                <div className="rounded-xl border border-slate-400 bg-white p-4">
                    <span className="flex items-center gap-2">
                        <House className={iconStyles} aria-hidden="true" />
                        <h3 className="m-0">When Replacement is Better</h3>
                    </span>
                    <div className="mt-2 space-y-2">
                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">The roof is nearing the end of its lifespan</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    Most shingle roofs last 15–25 years. If yours is in that range (or older), a full
                                    replacement may be smarter than patchwork repairs.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">You’re seeing widespread damage</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    Curling shingles, granule loss, sagging areas, or multiple leaks
                                    suggest structural wear that a patch can’t fix.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">There’s repeated or chronic leaking</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    If you’ve had more than one leak in different areas, it usually means the
                                    whole system is breaking down—not just one bad spot.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">Storm damage is severe or insurance-covered</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    After a hurricane or major windstorm, replacing the roof might be your best
                                    route—especially if a public adjuster confirms your policy will cover it.
                                </p>
                            </div>
                        </details>

                        <details className={detailsStyles}>
                            <summary className={summaryStyles}>
                                <span className="font-semibold">You want to boost home value or energy efficiency</span>
                                <ChevronDown className={chevronStyles} aria-hidden="true" />
                            </summary>
                            <div className={pStyles}>
                                <p className="m-0">
                                    A new roof adds curb appeal, resale value, and can even reduce insurance
                                    premiums—especially with updated underlayments and ventilation.
                                </p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </>
    )
}

