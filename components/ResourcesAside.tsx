import SmartLink from "./SmartLink"
import ResourcesQuickLinks from "./ResourcesQuickLinks"


export default async function ResourcesAside() {
    return (
        <aside className="sticky top-24">
            <ResourcesQuickLinks />

            <div className="grid">
                <SmartLink
                    href="tel:19418664320"
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                    <div className="flex w-full flex-col items-start gap-2">
                        <div className="text-sm font-semibold text-slate-900">Need help?</div>
                        <div className="text-slate-700">Talk to a real roofer now.</div>
                        <div className="inline-flex rounded-md bg-[#0045d7] px-4 py-2 text-sm font-semibold text-white">Call (941) 866-4320</div>
                    </div>
                </SmartLink>

                <SmartLink
                    href="/contact-us#book-an-appointment"
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                    <div className="flex w-full flex-col items-start gap-2">
                        <div className="text-sm text-center font-semibold text-slate-900">Prefer to write?</div>
                        <div className="text-slate-700">Send us a message and we’ll follow up.</div>
                        <div className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Contact form</div>
                    </div>
                </SmartLink>
            </div>
        </aside>
    )
}