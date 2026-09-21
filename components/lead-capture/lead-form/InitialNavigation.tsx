import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import SmartLink from '@/components/utils/SmartLink';
import { renderHighlight } from '@/components/utils/renderHighlight';
import { LEAD_NAVIGATION_CARDS } from '@/components/lead-capture/lead-form/config';
import {
  PROJECT_OPTION_CARD_BASE_CLASS,
  PROJECT_OPTION_CARD_UNSELECTED_CLASS,
  ProjectOptionCardContent,
} from '@/components/lead-capture/lead-form/ProjectOptionCard';

type Props = {
  heading?: string;
  headingId?: string;
  highlightText?: string | readonly string[];
  embedded?: boolean;
  trustPills?: ReactNode;
};

export default function InitialNavigation({
  heading = 'How Can We Help?', headingId, highlightText, embedded = false, trustPills,
}: Props = {}) {
  return (
    <section aria-labelledby={headingId} className={embedded ? 'w-full' : 'w-full bg-gradient-to-b from-[#eefbff] via-[#dff6ff] to-[#cef3ff] py-12'}>
      <div className={embedded ? 'mx-auto max-w-[1280px]' : 'mx-auto max-w-[1280px] px-4'}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[--brand-blue]">
            Explore Services
          </p>
          <h2 id={headingId} className="mt-4 text-3xl font-semibold text-slate-900 md:text-5xl">
            {renderHighlight(heading, highlightText)}
          </h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            Prefer to learn more first? Start with the page that fits your situation.
          </p>
          {trustPills}
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
