import Image from 'next/image';
import SmartLink from '@/components/utils/SmartLink';
import type { FooterBadge } from '@/lib/content/directus-site';

const imageStyles = 'my-6 h-[100px] w-auto object-contain';

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
      sizes="(max-width: 150px) 25vw, 366px"
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
