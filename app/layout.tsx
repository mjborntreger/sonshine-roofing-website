import type { Metadata, Viewport } from "next";
import RouteTransitions from "@/components/RouteTransitions"
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalyticsScripts from "@/lib/analytics";
import { inter, candara } from "@/lib/fonts";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://sonshineroofing.com"),
  alternates: { canonical: "./" },
  title: "SonShine Roofing — Sarasota, Manatee & Charlotte Counties",
  description:
    "Residential roof repair, replacement, inspections, and preventative maintenance. Since 1987 we’ve got you covered.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#0045d7" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${candara.variable}`}
    >
      <head>
        {/* Preconnects for faster YouTube thumbs & embeds */}
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" crossOrigin="" />

        {/* Facebook Share Button Attribution*/}
        <meta property="fb:app_id" content="1087269253041713" />

      </head>
      <body
        className="
          min-h-svh flex flex-col
          bg-neutral-50 text-slate-900 antialiased
          selection:bg-[#0045d7] selection:text-white
        "
      >
        <AnalyticsScripts />
        <Header />
        <main className="flex-1">
          <RouteTransitions variant="zoom" duration={0.35}>
            {children}
          </RouteTransitions>
        </main>
        <Footer />
        {/* Tawk.to live chat (loads on every page) */}
        <Script id="tawk-init" strategy="afterInteractive">
          {`
            window.Tawk_API = window.Tawk_API || {};
            window.Tawk_LoadStart = new Date();
          `}
        </Script>
        <Script
          id="tawk-script"
          strategy="afterInteractive"
          src="https://embed.tawk.to/5a971646d7591465c708203c/default"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
