'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
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
  const verificationRef = useRef<HTMLDivElement>(null);
  const [hasVisibleVerification, setHasVisibleVerification] = useState(false);

  useEffect(() => {
    const container = verificationRef.current;
    if (!container) return;
    const updateVisibility = () => setHasVisibleVerification(container.getBoundingClientRect().height > 0);
    updateVisibility();
    const observer = new ResizeObserver(updateVisibility);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('[--lead-form-gap:1.5rem] space-y-[--lead-form-gap]', className)}>
      <div>
        {/* Keep verification mounted so an interactive challenge can still appear. */}
        <div ref={verificationRef} className="flow-root">{verification}</div>
        <div
          className="space-y-[--lead-form-gap]"
          style={{ marginTop: hasVisibleVerification ? 'var(--lead-form-gap)' : 0 }}
        >
          {feedback}
          {actions}
        </div>
      </div>
      <SmsConsentFields {...consent} showFooter />
    </div>
  );
}
