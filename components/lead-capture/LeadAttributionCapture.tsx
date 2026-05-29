'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureLeadAttributionFromCurrentUrl } from '@/lib/lead-capture/attribution';

export default function LeadAttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? '';

  useEffect(() => {
    captureLeadAttributionFromCurrentUrl();
  }, [pathname, search]);

  return null;
}
