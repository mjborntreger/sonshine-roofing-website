'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useSiteSettings } from '@/lib/content/site-settings-context';

type SitePhoneLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  children?: ReactNode;
};

export default function SitePhoneLink({ children, ...props }: SitePhoneLinkProps) {
  const { phone, phoneHref } = useSiteSettings();

  return (
    <a href={phoneHref} {...props}>
      {children}
      {children ? ' ' : null}
      {phone}
    </a>
  );
}
