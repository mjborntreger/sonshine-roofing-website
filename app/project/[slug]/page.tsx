import Image from "next/image";
import SmartLink from "@/components/SmartLink";
import Section from "@/components/layout/Section";
import { headers } from "next/headers";
import { getProjectBySlug, listProjectSlugs } from "@/lib/wp";
import ProjectVideo from "./ProjectVideo";
import ShareWhatYouThink from "@/components/ShareWhatYouThink";

import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { creativeWorkSchema, videoObjectSchema } from "@/lib/seo/schema";
import { resolveSiteOrigin } from "@/lib/seo/site";

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
  if (!project) {
    return buildArticleMetadata({
      title: "Project Not Found · SonShine Roofing",
      description: "This project could not be found.",
      path: `/project/${slug}`,
    });
  }

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
  <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
    {children}
  </span>
);

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return (
      <Section>
        <h1>Project Not Found</h1>
        <p>
          Try our{" "}
          <SmartLink className="text-brand-blue underline" href="/project">
            Project Gallery
          </SmartLink>
          .
        </p>
      </Section>
    );
  }

  const videoId = getYouTubeId(project.youtubeUrl);
  const hasAnyBadges =
    (project.materialTypes?.length ?? 0) +
      (project.roofColors?.length ?? 0) +
      (project.serviceAreas?.length ?? 0) >
    0;

  const origin = resolveSiteOrigin(await headers());
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

  const videoSchema = videoId
    ? videoObjectSchema({
        name: project.title,
        description: (project.seo?.description || project.projectDescription || "").slice(0, 160),
        canonicalUrl: `/project/${slug}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        contentUrl: project.youtubeUrl ?? undefined,
        thumbnailUrls: [ogImgAbs],
        uploadDate: project.date || undefined,
        origin,
      })
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
    additionalProperties: videoSchema ? { video: videoSchema } : undefined,
  });

  return (
    <Section>
      <JsonLd data={projectSchema} />
      <SmartLink href="/project" className="no-underline hover:underline text-sm text-slate-600">
        ← Back to projects
      </SmartLink>

      {/* Title + gradient stripe */}
      <div className="prose">
        <h1 className="mb-2">{project.title}</h1>
      </div>
      <div className="h-1 w-full mt-6 rounded-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
      <ShareWhatYouThink />

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[4fr_1fr]">
        {/* Left column: Video facade (fallback to image) + badges */}
        <div>
          {videoId ? (
            <ProjectVideo title={project.title} videoId={videoId} />
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
            <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="prose">
          {project.projectDescription && (
            <>
              <h3>Project Details</h3>
              <p>{project.projectDescription}</p>
            </>
          )}

          {project.productLinks?.length > 0 && (
            <>
              <h3 className="mt-6">Products Used</h3>
              <ul className="list-disc pl-5">
                {project.productLinks.map((p, i) => (
                  <li key={i}>
                    {p.productLink ? (
                      <a
                        href={p.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {p.productName}
                      </a>
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
        <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: project.contentHtml }} />
      )}
    </Section>
  );
}
