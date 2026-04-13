import { ArrowRight } from 'lucide-react';
import SmartLink from '@/components/utils/SmartLink';
import { LEAD_NAVIGATION_CARDS } from '@/components/lead-capture/lead-form/config';
import {
  PROJECT_OPTION_CARD_BASE_CLASS,
  PROJECT_OPTION_CARD_UNSELECTED_CLASS,
  ProjectOptionCardContent,
} from '@/components/lead-capture/lead-form/ProjectOptionCard';

export default function InitialNavigation() {
  return (
    <section className="w-full bg-gradient-to-b from-[#eefbff] via-[#dff6ff] to-[#cef3ff] py-12">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[--brand-blue]">
            Explore Services
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-5xl">
            How Can We Help?
          </h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            Prefer to learn more first? Start with the page that fits your situation.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {LEAD_NAVIGATION_CARDS.map((card) => (
            <SmartLink
              key={card.href}
              href={card.href}
              className={`${PROJECT_OPTION_CARD_BASE_CLASS} ${PROJECT_OPTION_CARD_UNSELECTED_CLASS}`}
            >
              <ProjectOptionCardContent option={card} />
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[--brand-blue]">
                Learn more
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </SmartLink>
          ))}
        </div>
      </div>
    </section>
  );
}
