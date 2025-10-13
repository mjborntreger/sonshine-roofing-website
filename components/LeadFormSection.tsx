'use client';

import { Suspense, useMemo } from 'react';
import LeadForm from '@/components/LeadForm';
import { restoreLeadSuccessState, type LeadSuccessRestore } from '@/components/lead-form/config';
import { LeadFormFallback } from '@/components/lead-form/Fallback';

export default function LeadFormSection() {
  const restoredSuccess = useMemo<LeadSuccessRestore | null>(() => restoreLeadSuccessState(), []);

  return (
    <div>
      <Suspense fallback={<LeadFormFallback />}>
        <LeadForm restoredSuccess={restoredSuccess} />
      </Suspense>
    </div>
  );
}
