import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

type HeroBadge = { label: string; icon?: ComponentType<SVGProps<SVGSVGElement>> };

type HeroProps = {
  title: string;
  subtitle?: string;
  imageSrc?: string;
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
  subtitle,
  imageSrc = FALLBACK_IMAGE,
  badges,
  className,
  children,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-slate-950 text-white",
        "shadow-[inset_0_-20px_60px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center md:bg-fixed"
        style={{ backgroundImage: `url(${imageSrc})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/80 via-slate-900/55 to-slate-900/35"
        aria-hidden="true"
      />

      <div className="container-edge relative z-10 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto max-w-3xl text-base md:text-lg leading-relaxed text-white/85">
              {subtitle}
            </p>
          ) : null}

          {badges?.length ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
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
  );
}
