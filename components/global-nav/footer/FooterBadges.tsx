import Image from 'next/image';
import SmartLink from '@/components/utils/SmartLink';
import type { FooterBadge } from '@/lib/content/directus-site';

const imageStyles = 'my-6 h-[100px] w-auto object-contain';
const footerBadgeSizes =
  '(min-width: 1152px) 109px, ' +
  '(min-width: 1024px) calc((100vw - 176px) / 9), ' +
  '(min-width: 768px) calc((100vw - 128px) / 5), ' +
  '(min-width: 640px) calc((100vw - 116px) / 4), ' +
  '(min-width: 320px) calc((100vw - 104px) / 3), ' +
  '27vw';

type FooterBadgesProps = {
  badges: FooterBadge[];
};

function BadgeImage({ badge }: { badge: FooterBadge }) {
  return (
    <Image
      src={badge.image.url}
      alt={badge.image.description}
      title={badge.image.description}
      height={badge.image.height ?? 100}
      width={badge.image.width ?? 150}
      sizes={footerBadgeSizes}
      className={imageStyles}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function FooterBadges({ badges }: FooterBadgesProps) {
  if (!badges.length) return null;

  return (
    <div className="mx-auto max-w-6xl px-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 place-items-center justify-center gap-3">
      {badges.map((badge) =>
        badge.href ? (
          <SmartLink
            key={badge.id}
            href={badge.href}
            target="_blank"
            rel="noopener noreferrer"
            title={badge.image.description}
            className={imageStyles}
          >
            <BadgeImage badge={badge} />
          </SmartLink>
        ) : (
          <div key={badge.id} className={imageStyles}>
            <BadgeImage badge={badge} />
          </div>
        ),
      )}
    </div>
  );
}
