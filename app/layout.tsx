import "./globals.css";
import { inter, candara } from "@/lib/ui/fonts";
import HashAnchorScroller from "@/components/utils/HashAnchorScroller";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${candara.variable}`}
    >
      <body className="min-h-svh bg-white text-slate-900 antialiased">
        <HashAnchorScroller />
        {children}
      </body>
    </html>
  );
}
