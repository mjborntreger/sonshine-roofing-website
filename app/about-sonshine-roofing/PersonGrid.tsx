import Image from 'next/image';
import type { Person } from '@/lib/wp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SmartLink from "@/components/SmartLink"

export default function PersonGrid({ people }: { people: Person[] }) {
  if (!people?.length) return null;

  return (
    <div className="w-full min-w-0">
      <ul className="grid grid-cols-2 gap-4 min-w-0 px-2 py-4">
        {people.map((p) => (
          <li key={p.slug} className="min-w-0">
            <SmartLink
                href={`/person/${p.slug}`}
                className="group block"
            >
              <Card className="overflow-hidden hover:shadow-lg transition">

                <CardHeader className="pb-8">
                  <CardTitle className="font-medium">{p.title}</CardTitle>
                  {p.positionTitle && (
                    <p className="text-sm opacity-80">{p.positionTitle}</p>
                  )}
                </CardHeader>

                {p.featuredImage && (
                  <div className="relative w-full aspect-[4/3] overflow-hidden [&>span]:rounded-none [&>span>img]:rounded-none [&_[data-nimg]]:rounded-none">
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText || p.title}
                      sizes="420px"
                      fill
                      className="object-cover !rounded-none"
                    />
                  </div>
                )}

                <CardContent>
                  <p>View profile <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></p>
                </CardContent>

              </Card>
            </SmartLink>
          </li>
        ))}
      </ul>
    </div>
  );
}