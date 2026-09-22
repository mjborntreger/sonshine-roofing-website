'use client';
import { createContext, useContext, type ReactNode } from 'react';
import Image from 'next/image';
import type { PublicImage } from '@/lib/content/public-image';
import { DirectusImage, type StaticImageProps } from './DirectusImage';

const MediaContext = createContext<Record<string, PublicImage> | null>(null);
export function StaticMediaProvider({ images, children }: { images: Record<string, PublicImage>; children: ReactNode }) {
  return <MediaContext.Provider value={images}>{children}</MediaContext.Provider>;
}
export default function ClientStaticImage({ src, alt, decorative, crop, position, ...props }: StaticImageProps) {
  const images = useContext(MediaContext);
  if (typeof src === 'string' && src.startsWith('static:')) {
    const image = images?.[src.slice(7)];
    if (!image) throw new Error('Static media selection was not supplied to this client surface');
    return <DirectusImage {...props} media={image} alt={alt} decorative={decorative} crop={crop} position={position} />;
  }
  return <Image {...props} src={src} alt={decorative ? '' : (alt ?? '')} />;
}
