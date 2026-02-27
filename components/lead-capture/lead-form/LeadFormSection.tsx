'use client';

import { Suspense, useMemo } from 'react';
import LeadForm from './LeadForm';
import { restoreLeadSuccessState, type LeadSuccessRestore } from '@/components/lead-capture/lead-form/config';
import { LeadFormFallback } from '@/components/lead-capture/lead-form/Fallback';

export default function LeadFormSection() {
  const restoredSuccess = useMemo<LeadSuccessRestore | null>(() => restoreLeadSuccessState(), []);

  return (
    <div>
      <Suspense fallback={<LeadFormFallback />}>
        <div className="max-w-[1280px] mx-auto">
          <LeadForm restoredSuccess={restoredSuccess} />
        </div>
      </Suspense>
    </div>
  );
}
