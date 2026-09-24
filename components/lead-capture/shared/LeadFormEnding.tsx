'use client';

import type { ComponentProps, ReactNode } from 'react';
import SmsConsentFields from './SmsConsentFields';
import { cn } from '@/lib/utils';

type Props = {
  verification: ReactNode;
  actions: ReactNode;
  consent: Omit<ComponentProps<typeof SmsConsentFields>, 'showFooter'>;
  feedback?: ReactNode;
  className?: string;
};

/** Keep verification, submission, and consent in the same DOM and visual order. */
export default function LeadFormEnding({ verification, actions, consent, feedback, className }: Props) {
  return (
    <div className={cn('space-y-6', className)}>
      {verification}
      {feedback}
      {actions}
      <SmsConsentFields {...consent} showFooter />
    </div>
  );
}
