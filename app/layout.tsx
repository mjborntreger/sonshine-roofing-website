import "./globals.css";
import { inter, allura, candara } from "@/lib/ui/fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${allura.variable} ${candara.variable}`}
    >
      <body className="min-h-svh bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
