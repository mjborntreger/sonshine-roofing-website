'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SmartLink from '@/components/utils/SmartLink';
import { PROJECT_OPTIONS, isJourneyKey, type JourneyKey, type LeadSuccessRestore } from '@/components/lead-capture/lead-form/config';
import LeadFormSkeleton from '@/components/lead-capture/lead-form/LeadFormSkeleton';
import { useUtmParams } from '@/components/lead-capture/useUtmParams';
import { renderHighlight } from '@/components/utils/renderHighlight';
import LeadFormStepShell from '@/components/lead-capture/lead-form/LeadFormStepShell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PROJECT_OPTION_CARD_BASE_CLASS,
  PROJECT_OPTION_CARD_UNSELECTED_CLASS,
  PROJECT_OPTION_CARD_SELECTED_CLASS,
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
  const [pendingJourney, setPendingJourney] = useState<JourneyKey | null>(null);
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

  const handleAdvance = useCallback(() => {
    if (!pendingJourney) return;
    setSelectedJourney(pendingJourney);
    setShowWizard(true);
  }, [pendingJourney]);

  const handleWizardReset = useCallback(() => {
    setSelectedJourney(null);
    setPendingJourney(null);
    setShowWizard(false);
  }, []);
  const stepZeroHeading = renderHighlight('Let’s get you squared away', 'squared away');
  const isContinueDisabled = !pendingJourney;

  return (
    <div id="get-started">
      {!showWizard && (
        <div ref={containerRef}>
          <LeadFormStepShell
            stepLabel="Step 1 of 4"
            title={stepZeroHeading}
            description="We’ll tailor the next few questions so we can route you to the right spot."
            bottomSlot={(
              <div className="mx-8 my-6 flex items-center justify-between gap-3">
                <Button type="button" data-icon-affordance="left" variant="secondary" size="sm" className="gap-2" disabled>
                  <ArrowLeft className="icon-affordance h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
                <Button
                  type="button"
                  data-icon-affordance="right"
                  variant="brandBlue"
                  size="sm"
                  className="gap-2"
                  disabled={isContinueDisabled}
                  onClick={() => handleAdvance()}
                >
                  Continue
                  <ArrowRight className="icon-affordance h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          >

            <div className="mb-8 flex items-center justify-between gap-3">
              <Button type="button" data-icon-affordance="left" variant="secondary" size="sm" className="gap-2" disabled>
                <ArrowLeft className="icon-affordance h-4 w-4" aria-hidden="true" />
                Back
              </Button>
              <Button
                type="button"
                data-icon-affordance="right"
                variant="brandBlue"
                size="sm"
                className="gap-2"
                disabled={isContinueDisabled}
                onClick={() => handleAdvance()}
              >
                Continue
                <ArrowRight className="icon-affordance h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-slate-600 inline-flex mt-2 mb-4 text-xs">Select an option to continue</p>

            <div className="grid gap-4 lg:grid-cols-2">
              {PROJECT_OPTIONS.map((option) => {
                const { value, action, href } = option;
                const journeyValue = isJourneyKey(value) ? value : null;
                const isSelectable = action === 'advance' && Boolean(journeyValue);
                const isSelected = Boolean(isSelectable && journeyValue && pendingJourney === journeyValue);
                const cardClass = cn(
                  PROJECT_OPTION_CARD_BASE_CLASS,
                  isSelected ? PROJECT_OPTION_CARD_SELECTED_CLASS : PROJECT_OPTION_CARD_UNSELECTED_CLASS
                );

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
                      setPendingJourney(journeyValue);
                    }}
                    className={cardClass}
                    aria-pressed={isSelected}
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
