'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { ProjectOption } from '@/components/lead-capture/lead-form/config';

export const PROJECT_OPTION_CARD_BASE_CLASS =
  'group flex h-full flex-col justify-between rounded-3xl border bg-white px-4 py-5 text-left shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue] focus-visible:ring-offset-2';
export const PROJECT_OPTION_CARD_UNSELECTED_CLASS =
  'border-blue-200 hover:-translate-y-0.5 hover:shadow-xl';
export const PROJECT_OPTION_CARD_SELECTED_CLASS = 'border-[--brand-blue] shadow-[0_10px_25px_rgba(15,76,129,0.12)]';

type ProjectOptionCardContentProps = {
  option: ProjectOption;
};

export function ProjectOptionCardContent({ option }: ProjectOptionCardContentProps) {
  const { label, description, imageSrc, imageAlt } = option;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[7/3] w-full overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 320px, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
      <h4 className="text-md leading-tight text-slate-900 md:text-xl">{label}</h4>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p className="text-xs text-slate-500 md:text-md">{description}</p>
        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </div>
  );
}
