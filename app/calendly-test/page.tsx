import type { Metadata } from "next";
import Script from "next/script";

const CALENDLY_URL = "https://calendly.com/michael-sonshineroofing?hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=0045d7";

export const metadata: Metadata = {
  title: "Calendly Test | SonShine Roofing",
  description: "Schedule time with the SonShine Roofing team using our embedded Calendly experience.",
};

export default function CalendlyTestPage() {
  return (
    <>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      <main className="py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 text-center">
          <header className="space-y-4">
            <h1 className="text-3xl font-semibold text-slate-900 md:text-5xl">
              Schedule with SonShine Roofing
            </h1>
            <p className="text-base text-slate-600 md:text-lg">
              Choose a time that works best for you and we'll confirm the details right away.
            </p>
          </header>
          <div className="flex w-full justify-center">
            <div
              className="calendly-inline-widget h-[1100px] w-full min-w-[320px] rounded-2xl"
              data-url={CALENDLY_URL}
              role="presentation"
            />
          </div>
          <p className="text-sm text-slate-500">
            Having trouble loading the scheduler? You can also visit
            {" "}
            <a
              className="font-medium text-blue-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              href={CALENDLY_URL}
              rel="noreferrer"
              target="_blank"
            >
              this direct Calendly link
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
