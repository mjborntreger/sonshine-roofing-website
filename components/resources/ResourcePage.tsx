import type { ReactNode } from 'react';
import Section from '@/components/layout/Section';
import ResourcesAside from '@/components/global-nav/static-pages/ResourcesAside';
import SmartLink from '@/components/utils/SmartLink';

export default function ResourcePage({
  title,
  introduction,
  activePath,
  children,
}: {
  title: string;
  introduction: string;
  activePath: string;
  children: ReactNode;
}) {
  return (
    <Section className="py-8 md:py-10">
      <div className="px-2">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-600">
          <SmartLink href="/" className="text-[--brand-blue] hover:underline">
            Home
          </SmartLink>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span aria-current="page">{activePath === '/faq' ? 'FAQ' : 'Roofing Glossary'}</span>
        </nav>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <header className="mb-6">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
                {introduction}
              </p>
            </header>
            {children}
          </div>
          <ResourcesAside activePath={activePath} />
        </div>
      </div>
    </Section>
  );
}
