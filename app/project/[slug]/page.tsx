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
import ProjectGallery from "@/components/dynamic-content/project/ProjectGallery";
import { PROJECT_GALLERY_DEFAULT_HEIGHT, PROJECT_GALLERY_DEFAULT_WIDTH } from "@/components/dynamic-content/project/galleryConfig";
import ProjectTestimonial from "@/components/dynamic-content/project/ProjectTestimonial";

import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { creativeWorkSchema, projectReviewSchema, videoObjectSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";
import { List, Rows3 } from "lucide-react";
import BackToProjectsButton from "@/components/dynamic-content/project/BackToProjectsButton";

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
  <span className="inline-block px-2 py-1 text-xs rounded-full bg-[--brand-orange] text-white">
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

  const seenGalleryUrls = new Set<string>();
  const galleryImageObjects: Array<Record<string, unknown>> = [];
  const addImageObject = (
    url?: string | null,
    caption?: string | null,
    width?: number | null,
    height?: number | null,
    ref?: string
  ) => {
    if (!url) return;
    const absoluteUrl = url.startsWith("http") ? url : `${origin}${url}`;
    if (seenGalleryUrls.has(absoluteUrl)) return;
    const index = galleryImageObjects.length + 1;
    const object: Record<string, unknown> = {
      "@type": "ImageObject",
      "@id": `${shareUrl}#image-${ref ?? index}`,
      url: absoluteUrl,
      contentUrl: absoluteUrl,
    };
    if (caption && caption.trim().length > 0) object.caption = caption.trim();
    const widthValue = typeof width === "number" && Number.isFinite(width) ? width : PROJECT_GALLERY_DEFAULT_WIDTH;
    object.width = widthValue;
    if (typeof height === "number" && Number.isFinite(height)) object.height = height;
    galleryImageObjects.push(object);
    seenGalleryUrls.add(absoluteUrl);
  };

  addImageObject(
    ogImgAbs,
    project.heroImage?.altText ?? project.title,
    project.heroImage?.width ?? PROJECT_GALLERY_DEFAULT_WIDTH,
    project.heroImage?.height ?? PROJECT_GALLERY_DEFAULT_HEIGHT,
    "primary"
  );

  project.projectImages.forEach((img, idx) => {
    addImageObject(
      img.url,
      img.altText || project.title,
      img.width ?? PROJECT_GALLERY_DEFAULT_WIDTH,
      img.height ?? PROJECT_GALLERY_DEFAULT_HEIGHT,
      `gallery-${idx + 1}`
    );
  });

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

  const projectAdditionalProps: Record<string, unknown> = {};
  if (videoSchemaNoContext) projectAdditionalProps.video = videoSchemaNoContext;
  if (galleryImageObjects.length > 0) projectAdditionalProps.image = galleryImageObjects;

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
    additionalProperties: Object.keys(projectAdditionalProps).length ? projectAdditionalProps : undefined,
  });

  const reviewSchema =
    project.customerTestimonial
      ? projectReviewSchema({
        testimonial: project.customerTestimonial,
        projectName: project.title,
        projectUrl: shareUrl,
        projectImage: project.heroImage?.url,
        origin,
      })
      : null;

  return (
    <Section>
      {videoSchema ? <JsonLd id="project-video" data={videoSchema} /> : null}
      <JsonLd data={projectSchema} />
      {reviewSchema ? <JsonLd id="project-review" data={reviewSchema} /> : null}

      {/* Title + gradient stripe */}
      <div>
        <BackToProjectsButton />
        <h1 className="mb-8 mt-4 text-3xl md:text-5xl">{project.title}</h1>
      </div>
      <ShareWhatYouThink urlOverride={shareUrl} />

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
              <Badge>Roof Replacement</Badge>
            </div>
          )}

          {/* Customer Testimonial */}
          {project.customerTestimonial ? (
            <ProjectTestimonial testimonial={project.customerTestimonial} className="my-8" />
          ) : null}

          {/* Gallery */}
          <ProjectGallery images={project.projectImages} projectTitle={project.title} />
        </div>

        {/* Right column: Project Details + Products */}
        <div className="p-6 sticky top-24 prose bg-white shadow-md rounded-3xl border-blue-200">
          {project.projectDescription && (
            <>
              <h3>
                <Rows3 className="text-[--brand-blue] mr-2 inline h-5 w-5" />
                Project Summary
              </h3>
              <p>{project.projectDescription}</p>
            </>
          )}

          {project.productLinks?.length > 0 && (
            <>
              <h3
                className="mt-6"
              >
                <List className="text-[--brand-blue] mr-2 inline h-5 w-5" />
                Products Used
              </h3>
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

        {/* Block Editor Field */}
        {project.contentHtml && (
          <div className="mt-6 prose" dangerouslySetInnerHTML={{ __html: project.contentHtml }} />
        )}
      </div>

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
