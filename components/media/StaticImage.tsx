import Image from 'next/image';
import { staticImage } from '@/lib/content/static-media';
import { DirectusImage, type StaticImageProps } from './DirectusImage';

/** Static selections resolve on the server; unrelated CMS image presentation stays intact. */
export default function StaticImage({ src, alt, decorative, crop, position, ...props }: StaticImageProps) {
  if (typeof src === 'string' && src.startsWith('static:')) {
    return <DirectusImage {...props} media={staticImage(src)} alt={alt} decorative={decorative} crop={crop} position={position} />;
  }
  return <Image {...props} src={src} alt={decorative ? '' : (alt ?? '')} />;
}
