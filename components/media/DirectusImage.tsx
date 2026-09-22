import type { Ref } from 'react';
import Image, { type ImageProps } from 'next/image';
import type { PublicImage } from '@/lib/content/public-image';
import { imagePosition } from '@/lib/content/public-image';

export type DirectusImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  media: PublicImage;
  ref?: Ref<HTMLImageElement>;
  alt?: string;
  decorative?: boolean;
  crop?: boolean;
  position?: string;
};

/** Synchronous renderer usable from either React boundary. Next retains delivery. */
export function DirectusImage({ media, alt, decorative = false, crop = false, position, style, fill, width, height, ...props }: DirectusImageProps) {
  return <Image {...props} src={media.url} alt={decorative ? '' : (alt ?? media.description)} fill={fill}
    width={fill ? undefined : (width ?? media.width)} height={fill ? undefined : (height ?? media.height)}
    style={{ ...style, ...(crop ? { objectPosition: imagePosition(media, position ?? (style?.objectPosition != null ? String(style.objectPosition) : undefined)) } : {}) }} />;
}

export type StaticImageProps = Omit<ImageProps, 'alt'> & {
  alt?: string; decorative?: boolean; crop?: boolean; position?: string;
};
