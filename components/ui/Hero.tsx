import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

type HeroBadge = { label: string; icon?: ComponentType<SVGProps<SVGSVGElement>> };

type HeroProps = {
  title: string;
  subtitle?: string;
  eyelash?: string;
  imageSrc?: string;
  justifyStart?: boolean
  badges?: HeroBadge[];
  className?: string;
  children?: ReactNode;
};

const FALLBACK_IMAGE = "https://next.sonshineroofing.com/wp-content/uploads/Fallback-Hero.webp";

/**
 * Base hero for service/resource/blog/project pages.
 * Example:
 * <Hero title="Project Spotlight" subtitle="Roofing done right" badges={[{ icon: ShieldCheck, label: "Licensed & insured" }]} />
 */
export default function Hero({
  title,
  eyelash,
  subtitle,
  imageSrc = FALLBACK_IMAGE,
  justifyStart = false,
  badges,
  className,
  children,
}: HeroProps) {
    const TEXT_CONTAINER = justifyStart
    ? "text-left items-start mx-auto max-w-6xl space-y-6"
    : "text-center items-center mx-auto max-w-5xl space-y-6";
    const BADGE_CONTAINER = justifyStart
    ? "flex flex-wrap items-center justify-start gap-2 pt-2"
    : "flex flex-wrap items-center justify-center gap-2 pt-2";


  return (
    <>
      <section
        className={cn(
          "relative isolate overflow-hidden bg-slate-950 text-white",
          "shadow-[inset_0_-20px_60px_rgba(0,0,0,0.3)]",
          className,
        )}
      >
        <div
          className="absolute inset-0 -z-20 bg-cover bg-top"
          style={{ backgroundImage: `url(${imageSrc})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/75 to-black/80"
          aria-hidden="true"
        />

        <div className="container-edge relative z-10 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className={TEXT_CONTAINER}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-white">
              {title}
            </h1>
            {eyelash ? (
              <p className="text-sm uppercase font-bold text-blue-200 leading-tight tracking-wide">{eyelash}</p>
            ): null}
            {subtitle ? (
              <p className="text-base md:text-lg leading-relaxed text-slate-200">
                {subtitle}
              </p>
            ) : null}

            {badges?.length ? (
              <div className={BADGE_CONTAINER}>
                {badges.map(({ label, icon: Icon }, index) => (
                  <span
                    key={`${label}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur"
                  >
                    {Icon ? <Icon className="h-4 w-4 text-[--brand-cyan]" aria-hidden="true" /> : null}
                    <span className="leading-tight">{label}</span>
                  </span>
                ))}
              </div>
            ) : null}

            {children ? <div className="pt-4">{children}</div> : null}
          </div>
        </div>
      </section>

      <div className="h-1 w-full bg-gradient-to-r from-[--brand-blue] via-blue-500 to-blue-200" />
    </>
  );
}
