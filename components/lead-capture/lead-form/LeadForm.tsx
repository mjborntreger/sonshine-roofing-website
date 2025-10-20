'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import SmartLink from '@/components/utils/SmartLink';
import { PROJECT_OPTIONS, isJourneyKey, type JourneyKey, type LeadSuccessRestore } from '@/components/lead-capture/lead-form/config';
import LeadFormSkeleton from '@/components/lead-capture/lead-form/LeadFormSkeleton';
import { useUtmParams } from '@/components/lead-capture/useUtmParams';
import { renderHighlight } from '@/components/utils/renderHighlight';

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

  const handleAdvance = useCallback((journey: JourneyKey) => {
    setSelectedJourney(journey);
    setShowWizard(true);
  }, []);

  const handleWizardReset = useCallback(() => {
    setSelectedJourney(null);
    setShowWizard(false);
  }, []);
  const stepZeroHeading = renderHighlight('Let’s get you squared away', 'squared away');

  return (
    <div id="get-started">
      {!showWizard && (
        <div ref={containerRef} className="overflow-hidden mx-auto max-w-5xl rounded-3xl border border-blue-100 bg-white shadow-md">
          <div className="border-b border-blue-100 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[--brand-blue]">Step 1 of 4</p>
                <h3 className="mt-3 mb-4 text-2xl md:text-3xl font-semibold text-slate-900">{stepZeroHeading}</h3>
                <p className="mt-3 text-xs md:text-sm text-slate-600">
                  We’ll tailor the next few questions so we can route you to the right spot.
                </p>
              </div>
              <div className="relative mb-4 h-[54px] w-[158px] aspect-[21/9]">
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-text.webp"
                  alt="sonshine logo, no swoosh"
                  width={158}
                  height={54}
                  className="absolute top-[20px] right-0"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {PROJECT_OPTIONS.map((option) => {
                const { value, label, description, icon: Icon, accent, action, href } = option;
                const content = (
                  <>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${accent}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {action === 'advance' ? 'Tap to select' : 'Opens a new page'}
                    </div>
                    <h4 className="mt-4 text-md md:text-xl font-semibold text-slate-900">{label}</h4>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <p className="text-xs md:text-md text-slate-500">{description}</p>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </>
                );

                if (action === 'link' && href) {
                  return (
                    <SmartLink
                      key={value}
                      href={href}
                      className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue] focus-visible:ring-offset-2"
                    >
                      <div>{content}</div>
                    </SmartLink>
                  );
                }

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleAdvance(value as JourneyKey)}
                    className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue] focus-visible:ring-offset-2"
                  >
                    <div>{content}</div>
                  </button>
                );
              })}
            </div>
          </div>
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
