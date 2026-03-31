'use client';

import { Suspense, useMemo } from 'react';
import LeadForm, { type LeadFormLayoutVariant } from './LeadForm';
import { restoreLeadSuccessState, type LeadSuccessRestore } from '@/components/lead-capture/lead-form/config';
import { LeadFormFallback } from '@/components/lead-capture/lead-form/Fallback';
import { cn } from '@/lib/utils';

type LeadFormSectionProps = {
  variant?: LeadFormLayoutVariant;
};

export default function LeadFormSection({ variant = 'default' }: LeadFormSectionProps) {
  const restoredSuccess = useMemo<LeadSuccessRestore | null>(() => restoreLeadSuccessState(), []);
  const sectionClassName = cn(
    'w-full',
    variant === 'heroOverlap' && 'relative isolate mt-[-12rem] bg-gradient-to-b from-transparent via-[--brand-cyan] to-[#cef3ff] pb-12 pt-16'
  );

  return (
    <div className={sectionClassName}>
      <Suspense fallback={<div className="mx-auto max-w-[1280px]"><LeadFormFallback /></div>}>
        <div className="max-w-[1280px] mx-auto">
          <LeadForm restoredSuccess={restoredSuccess} variant={variant} />
        </div>
      </Suspense>
    </div>
  );
}
