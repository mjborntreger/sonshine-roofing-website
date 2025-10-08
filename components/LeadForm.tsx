'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import SmartLink from '@/components/SmartLink';
import {
  PROJECT_OPTIONS,
  isJourneyKey,
  type JourneyKey,
  type LeadSuccessRestore,
  type LeadFormUtmParams,
} from '@/components/lead-form/config';
import LeadFormSkeleton from '@/components/lead-form/LeadFormSkeleton';

const LeadFormWizard = dynamic(() => import('./LeadFormWizard'), {
  ssr: false,
  loading: () => <LeadFormSkeleton />,
});

type LeadFormProps = {
  initialSuccessCookie?: string | null;
  restoredSuccess?: LeadSuccessRestore | null;
  utm?: LeadFormUtmParams;
};

export default function LeadForm({ initialSuccessCookie, restoredSuccess, utm }: LeadFormProps) {
  const initialJourneyFromSuccess = useMemo(() => {
    const journey = restoredSuccess?.formPreset.projectType;
    return journey && isJourneyKey(journey) ? journey : null;
  }, [restoredSuccess]);

  const [selectedJourney, setSelectedJourney] = useState<JourneyKey | null>(initialJourneyFromSuccess);
  const [showWizard, setShowWizard] = useState<boolean>(() => Boolean(restoredSuccess));

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

  return (
    <div>
      {!showWizard && (
        <div ref={containerRef} className="overflow-hidden mx-2 rounded-3xl border border-blue-100 bg-white shadow-md">
          <div className="border-b border-blue-100 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-6">
            <p className="text-xs uppercase tracking-wide text-[--brand-blue]">Step 1 of 4</p>
            <h3 className="mt-3 mb-4 text-xl md:text-3xl font-semibold text-slate-900">Let’s get you squared away</h3>
            <p className="mt-3 text-xs md:text-sm text-slate-600">
              We’ll tailor the next few questions so we can route you to the right spot.
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
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
          initialSuccessCookie={initialSuccessCookie}
          restoredSuccess={restoredSuccess}
          initialJourney={selectedJourney}
          onResetSuccess={handleWizardReset}
          utm={utm}
        />
      )}
    </div>
  );
}
