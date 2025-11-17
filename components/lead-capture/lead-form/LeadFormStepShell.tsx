'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type LeadFormStepShellProps = {
  stepLabel: string;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  className?: string;
  headerFooter?: ReactNode;
  bottomSlot?: ReactNode;
};

export default function LeadFormStepShell({
  stepLabel,
  title,
  description,
  children,
  className,
  headerFooter,
  bottomSlot,
}: LeadFormStepShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-md', className)}>
      <div className="border-b border-blue-100 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[--brand-blue]">{stepLabel}</p>
            <h3 className="mt-3 mb-4 text-2xl font-semibold text-slate-900 md:text-3xl">{title}</h3>
            <p className="mt-3 text-xs text-slate-600 md:text-sm">{description}</p>
          </div>
          <div className="relative mb-4 aspect-[21/9] h-[54px] w-[158px] shrink-0">
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-text.webp"
              alt="sonshine logo, no swoosh"
              width={158}
              height={54}
              className="absolute right-0 top-[20px]"
            />
          </div>
        </div>
        {headerFooter}
      </div>

      <div className="p-6">{children}</div>

      {bottomSlot}
    </div>
  );
}
