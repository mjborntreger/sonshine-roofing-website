'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { LeadFormUtmParams } from '@/components/lead-form/config';

const normalize = (value: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export function useUtmParams(): LeadFormUtmParams {
  const searchParams = useSearchParams();

  return useMemo<LeadFormUtmParams>(() => {
    if (!searchParams) return {};
    return {
      source: normalize(searchParams.get('utm_source')),
      medium: normalize(searchParams.get('utm_medium')),
      campaign: normalize(searchParams.get('utm_campaign')),
    };
  }, [searchParams]);
}
