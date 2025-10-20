import Image from "next/image";
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import { listFaqsWithContent } from "@/lib/content/wp";
import SmartLink from "@/components/utils/SmartLink";
import Section from "@/components/layout/Section";
import { notFound } from "next/navigation";
import { getProjectBySlug, listProjectSlugs, listRecentProjectsPool } from "@/lib/content/wp";
import ProjectVideo from "../../../components/dynamic-content/project/ProjectVideo";
import YouMayAlsoLike from "@/components/engagement/YouMayAlsoLike";
import ShareWhatYouThink from "@/components/engagement/ShareWhatYouThink";

import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { creativeWorkSchema, videoObjectSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";

type OgImageRecord = {
  url?: unknown;
  secureUrl?: unknown;
  width?: unknown;
  height?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Static paths
export async function generateStaticParams() {
  const slugs = await listProjectSlugs(200).catch(() => []);
  return slugs.map((slug: string) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const project = await getProjectBySlug(slug).catch(() => null);
  if (!project) notFound();

  const seo = project.seo ?? {};
  const og = seo.openGraph ?? {};

  const title = (seo.title || og.title || project.title || "Project · SonShine Roofing").trim();
  const description = (seo.description || og.description || project.projectDescription || "").trim().slice(0, 160);

  const ogImageRecord = isRecord(og.image) ? (og.image as OgImageRecord) : null;
  const ogUrl: string =
    (ogImageRecord && typeof ogImageRecord.secureUrl === "string" && ogImageRecord.secureUrl) ||
    (ogImageRecord && typeof ogImageRecord.url === "string" && ogImageRecord.url) ||
    project.heroImage?.url ||
    "/og-default.png";
  const ogWidth: number =
    (ogImageRecord && typeof ogImageRecord.width === "number" && ogImageRecord.width) || 1200;
  const ogHeight: number =
    (ogImageRecord && typeof ogImageRecord.height === "number" && ogImageRecord.height) || 630;

  return buildArticleMetadata({
    title,
    description,
    path: `/project/${slug}`,
    image: { url: ogUrl, width: ogWidth, height: ogHeight },
    publishedTime: project.date ?? undefined,
    modifiedTime: project.modified ?? undefined,
  });
}

// Extract YouTube ID from various URL formats
function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const s = String(url).trim();
  // Raw ID support
  if (/^[A-Za-z0-9_-]{8,}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    if (parts.length === 1 && /^[A-Za-z0-9_-]{8,}$/.test(parts[0])) return parts[0];
    return null;
  } catch {
    return null;
  }
}

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
    {children}
  </span>
);

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const projectPromise = getProjectBySlug(slug);
  const projectPoolPromise = listRecentProjectsPool(36);
  const faqsPromise = listFaqsWithContent(8, "roof-replacement").catch(() => []);

  const project = await projectPromise;

  if (!project) notFound();

  const [projectPool, faqs] = await Promise.all([projectPoolPromise, faqsPromise]);
  const serviceAreaSlugs = (project.serviceAreas ?? [])
    .map((term) => term?.slug)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const primaryServiceAreaName =
    project.serviceAreas && project.serviceAreas.length > 0
      ? project.serviceAreas[0]?.name ?? null
      : null;

  const videoId = getYouTubeId(project.youtubeUrl);
  const hasAnyBadges =
    (project.materialTypes?.length ?? 0) +
    (project.roofColors?.length ?? 0) +
    (project.serviceAreas?.length ?? 0) >
    0;

  const origin = SITE_ORIGIN;
  const shareUrl = `${origin}/project/${slug}`;

  const ogImageSecondary = isRecord(project.seo?.openGraph?.image)
    ? (project.seo?.openGraph?.image as OgImageRecord)
    : null;
  const ogImgMaybe =
    (ogImageSecondary && typeof ogImageSecondary.secureUrl === "string" && ogImageSecondary.secureUrl) ||
    (ogImageSecondary && typeof ogImageSecondary.url === "string" && ogImageSecondary.url) ||
    project.heroImage?.url ||
    "/og-default.png";
  const ogImgAbs = ogImgMaybe.startsWith("http") ? ogImgMaybe : `${origin}${ogImgMaybe}`;

  const areaServed = (project.serviceAreas || []).map((t) => t.name);
  const materials = (project.materialTypes || []).map((t) => t.name);
  const colors = (project.roofColors || []).map((t) => t.name);
  const posterUrl = project.heroImage?.url ? ogImgAbs : undefined;

  const videoSchemaInput = videoId
    ? {
      name: project.title,
      description: (project.seo?.description || project.projectDescription || "").slice(0, 160),
      canonicalUrl: `/project/${slug}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      contentUrl: project.youtubeUrl ?? undefined,
      thumbnailUrls: [ogImgAbs],
      uploadDate: project.date || undefined,
      origin,
    }
    : null;

  const videoSchema = videoSchemaInput ? videoObjectSchema(videoSchemaInput) : undefined;
  const videoSchemaNoContext = videoSchemaInput
    ? videoObjectSchema({ ...videoSchemaInput, withContext: false })
    : undefined;

  const projectSchema = creativeWorkSchema({
    name: project.title,
    description: (project.seo?.description || project.projectDescription || "").slice(0, 160),
    url: shareUrl,
    image: ogImgAbs,
    datePublished: project.date || undefined,
    dateModified: project.modified || undefined,
    material: materials,
    about: colors,
    areaServed,
    origin,
    isPartOf: { "@type": "CollectionPage", "@id": `${origin}/project`, name: "Project Gallery" },
    publisher: {
      "@type": "Organization",
      name: "SonShine Roofing",
      logo: { "@type": "ImageObject", url: `${origin}/icon.png` },
    },
    additionalProperties: videoSchemaNoContext ? { video: videoSchemaNoContext } : undefined,
  });

  return (
    <Section>
      {videoSchema ? <JsonLd id="project-video" data={videoSchema} /> : null}
      <JsonLd data={projectSchema} />

      {/* Title + gradient stripe */}
      <div className="prose">
        <h1 className="my-4 text-3xl md:text-5xl">{project.title}</h1>
      </div>
      <ShareWhatYouThink />

      <div className="h-1 w-full mt-6 mb-2 rounded-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[4fr_2fr]">
        {/* Left column: Video facade (fallback to image) + badges */}
        <div>
          {videoId ? (
            <ProjectVideo
              title={project.title}
              videoId={videoId}
              posterUrl={posterUrl}
              posterAlt={project.heroImage?.altText || project.title}
            />
          ) : (
            project.heroImage?.url && (
              <Image
                src={project.heroImage.url}
                alt={project.heroImage.altText || project.title}
                width={1280}
                height={720}
                sizes="(max-width: 1280px) 100vw, 768px"
                className="rounded-2xl bg-neutral-50"
                priority
                fetchPriority="high"
                loading="eager"
              />
            )
          )}

          {hasAnyBadges && (
            <div className="flex flex-wrap gap-2 mt-4">
              {project.materialTypes?.map((t) => (
                <Badge key={`mt-${t.slug}`}>{t.name}</Badge>
              ))}
              {project.roofColors?.map((t) => (
                <Badge key={`rc-${t.slug}`}>{t.name}</Badge>
              ))}
              {project.serviceAreas?.map((t) => (
                <Badge key={`sa-${t.slug}`}>{t.name}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Project Details + Products */}
        <div className="p-6 prose bg-white shadow-md rounded-3xl border-slate-200">
          {project.projectDescription && (
            <>
              <h3>Project Summary</h3>
              <p>{project.projectDescription}</p>
            </>
          )}

          {project.productLinks?.length > 0 && (
            <>
              <h3 className="mt-6">Products Used</h3>
              <ul className="pl-5 list-disc">
                {project.productLinks.map((p, i) => (
                  <li key={i}>
                    {p.productLink ? (
                      <SmartLink
                        href={p.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {p.productName}
                      </SmartLink>
                    ) : (
                      <span>{p.productName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      {project.contentHtml && (
        <div className="mt-6 prose" dangerouslySetInnerHTML={{ __html: project.contentHtml }} />
      )}

      <YouMayAlsoLike
        variant="project"
        projects={projectPool}
        serviceAreaSlug={serviceAreaSlugs}
        serviceAreaName={primaryServiceAreaName}
        excludeSlug={project.slug}
      />

      <FaqInlineList
        heading="Roof Replacement FAQs"
        topicSlug="roof-replacement"
        limit={8}
        initialItems={faqs}
        seeMoreHref="/faq"
      />
    </Section>
  );
}
