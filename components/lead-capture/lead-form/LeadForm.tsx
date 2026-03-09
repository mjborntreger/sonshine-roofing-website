'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SmartLink from '@/components/utils/SmartLink';
import { PROJECT_OPTIONS, isJourneyKey, type JourneyKey, type LeadSuccessRestore } from '@/components/lead-capture/lead-form/config';
import LeadFormSkeleton from '@/components/lead-capture/lead-form/LeadFormSkeleton';
import { useUtmParams } from '@/components/lead-capture/useUtmParams';
import { renderHighlight } from '@/components/utils/renderHighlight';
import LeadFormStepShell from '@/components/lead-capture/lead-form/LeadFormStepShell';
import { cn } from '@/lib/utils';
import {
  PROJECT_OPTION_CARD_BASE_CLASS,
  PROJECT_OPTION_CARD_UNSELECTED_CLASS,
  ProjectOptionCardContent,
} from '@/components/lead-capture/lead-form/ProjectOptionCard';

const LeadFormWizard = dynamic(() => import('@/components/lead-capture/lead-form/LeadFormWizard'), {
  ssr: false,
  loading: () => <LeadFormSkeleton />,
});

type LeadFormProps = {
  restoredSuccess?: LeadSuccessRestore | null;
};

export default function LeadForm({ restoredSuccess }: LeadFormProps = {}) {
  const initialJourneyFromSuccess = useMemo(() => {
    const journey = restoredSuccess?.formPreset.projectType;
    return journey && isJourneyKey(journey) ? journey : null;
  }, [restoredSuccess]);

  const [selectedJourney, setSelectedJourney] = useState<JourneyKey | null>(initialJourneyFromSuccess);
  const [showWizard, setShowWizard] = useState<boolean>(() => Boolean(restoredSuccess));
  const utm = useUtmParams();

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showWizard) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const { current } = containerRef;
    if (!current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const preloadable = LeadFormWizard as unknown as { preload?: () => void };
          preloadable.preload?.();
          observer.disconnect();
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(current);
    return () => observer.disconnect();
  }, [showWizard]);

  const handleWizardReset = useCallback(() => {
    setSelectedJourney(null);
    setShowWizard(false);
  }, []);
  const stepZeroHeading = renderHighlight('How can we help?', 'we help');

  return (
    <div id="get-started">
      {!showWizard && (
        <div className="px-4 py-16" ref={containerRef}>
          <LeadFormStepShell
            stepLabel="Step 1 of 4"
            title={stepZeroHeading}
            description="We’ll tailor the next few questions so we can route you to the right spot."
          >
            <p className="text-slate-600 inline-flex mt-2 mb-4 text-sm sm:text-base">Select an option to continue.</p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {PROJECT_OPTIONS.map((option) => {
                const { value, action, href } = option;
                const journeyValue = isJourneyKey(value) ? value : null;
                const cardClass = cn(PROJECT_OPTION_CARD_BASE_CLASS, PROJECT_OPTION_CARD_UNSELECTED_CLASS);

                if (action === 'link' && href) {
                  return (
                    <SmartLink key={value} href={href} className={cardClass}>
                      <ProjectOptionCardContent option={option} />
                    </SmartLink>
                  );
                }

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (!journeyValue) return;
                      setSelectedJourney(journeyValue);
                      setShowWizard(true);
                    }}
                    className={cardClass}
                  >
                    <ProjectOptionCardContent option={option} />
                  </button>
                );
              })}
            </div>
          </LeadFormStepShell>
        </div>
      )}

      {showWizard && (
        <LeadFormWizard
          restoredSuccess={restoredSuccess}
          initialJourney={selectedJourney}
          onResetSuccess={handleWizardReset}
          utm={utm}
        />
      )}
    </div>
  );
}
