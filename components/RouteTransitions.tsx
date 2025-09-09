'use client';

import { usePathname } from 'next/navigation';
import PageTransition, { type TransitionVariant } from '@/components/PageTransitions';
import type { Easing } from 'framer-motion';

export default function RouteTransitions({
  children,
  variant = 'slideUp',     // global default (change to taste)
  duration,
  ease,
}: {
  children: React.ReactNode;
  variant?: TransitionVariant;
  duration?: number;
  ease?: Easing | Easing[];
}) {
  const pathname = usePathname();
  return (
    <PageTransition key={pathname} variant={variant} duration={duration} ease={ease}>
      {children}
    </PageTransition>
  );
}