import Image from 'next/image';
import SmartLink from '@/components/utils/SmartLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LocationSectionHeading from '@/components/location/LocationSectionHeading';
import type { LocationNeighborhood, LocationProject } from '@/lib/content/location-types';
import type { ProjectImage } from '@/lib/content/project-types';

type Props = {
  areaId: string;
  locationName: string;
  mapImage: ProjectImage | null;
  neighborhoods: LocationNeighborhood[];
  /** Published local project matches from the same deployment. */
  projects: LocationProject[];
};

export default function ServiceAreaSection({ areaId, locationName, mapImage, neighborhoods, projects }: Props) {
  const coverage = neighborhoods.filter((item) => item.serviceAreaId === areaId && item.name.trim());
  if (!mapImage && !coverage.length) return null;

  return (
    <section aria-labelledby="location-coverage" className="space-y-8">
      <LocationSectionHeading id="location-coverage" heading={`Roofing coverage in ${locationName}`}
        highlightText={locationName}
        description="Explore the neighborhoods we serve, with links to our published projects where available." />

      {mapImage ? (
        <figure className="max-w-4xl space-y-3">
          <Image src={mapImage.url} alt={mapImage.altText}
            width={mapImage.width || 1080} height={mapImage.height || 907}
            sizes="(max-width: 1024px) 100vw, 896px"
            className="h-auto w-full rounded-3xl border border-blue-200" />
          <figcaption className="text-sm text-slate-600">{locationName} service coverage map</figcaption>
        </figure>
      ) : null}

      {coverage.length ? (
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coverage.map((neighborhood) => {
            const matchingProjects = projects.filter((record) =>
              record.status === 'published' &&
              record.serviceAreaIds.includes(areaId) &&
              record.project.neighborhood?.id === neighborhood.id,
            );
            const description = neighborhood.description?.trim();
            const landmarks = neighborhood.landmarks?.trim();
            const attribution = neighborhood.image?.attribution;
            const hasDetails = Boolean(description || landmarks || matchingProjects.length);
            return (
              <Card key={neighborhood.id}>
                <CardHeader><CardTitle>{neighborhood.name}</CardTitle></CardHeader>
                {neighborhood.image ? (
                  <figure>
                    <Image src={neighborhood.image.url} alt={neighborhood.image.altText}
                      width={neighborhood.image.width || 960} height={neighborhood.image.height || 540}
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="h-auto w-full" />
                    {attribution ? (
                      <figcaption className="px-6 py-3 text-xs leading-relaxed text-slate-600">
                        Photo: <SmartLink href={attribution.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="underline underline-offset-2">{attribution.title}</SmartLink>
                        {' by '}
                        {attribution.creatorUrl ? (
                          <SmartLink href={attribution.creatorUrl} target="_blank" rel="noopener noreferrer"
                            className="underline underline-offset-2">{attribution.creator}</SmartLink>
                        ) : attribution.creator}.
                        {' '}<SmartLink href={attribution.licenseUrl} target="_blank" rel="license noopener noreferrer"
                          className="underline underline-offset-2">{attribution.license}</SmartLink>.
                        {attribution.changes ? ` ${attribution.changes}` : null}
                      </figcaption>
                    ) : null}
                  </figure>
                ) : null}
                {neighborhood.mapImage ? (
                  <Image src={neighborhood.mapImage.url} alt={neighborhood.mapImage.altText}
                    width={neighborhood.mapImage.width || 960} height={neighborhood.mapImage.height || 540}
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="h-auto w-full" />
                ) : null}
                {hasDetails ? (
                  <CardContent className="space-y-4 text-slate-600">
                    {description ? <p>{description}</p> : null}
                    {landmarks ? <p><span className="font-semibold">Nearby landmarks: </span>{landmarks}</p> : null}
                    {matchingProjects.length ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-800">Featured Projects:</h4>
                        <ul className="list-disc space-y-2 pl-5">
                          {matchingProjects.map(({ id, project }) => (
                            <li key={id}>
                              <SmartLink href={project.uri} className="font-semibold text-brand-blue underline underline-offset-4">
                                {project.title}
                              </SmartLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
