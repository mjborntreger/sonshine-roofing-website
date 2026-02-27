import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Performance Truck for Sale | ProCharged GMC Sierra Denali",
  description: "Real-world 800-wheel-horsepower ProCharged GMC Sierra Denali with 4WD traction, daily drivability, and a fully built 6.2L. Asking $90,000 cash.",
  alternates: { canonical: "/truck-for-sale" },
};

export const viewport: Viewport = {
  themeColor: [{ color: "#ecfeff" }],
};

export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-cyan-50 text-slate-900 antialiased">
      {children}
    </div>
  );
}
