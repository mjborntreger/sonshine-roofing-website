import type { Metadata } from "next";

export type OgImageInput = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type OpenGraphMetadata = NonNullable<Metadata["openGraph"]>;
export const DEFAULT_OG_IMAGE: Required<Omit<OgImageInput, "alt">> & { alt?: string } = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
};

function normalizeOgImage(image?: OgImageInput) {
  const base = image ?? DEFAULT_OG_IMAGE;
  return {
    url: base.url,
    width: base.width ?? DEFAULT_OG_IMAGE.width,
    height: base.height ?? DEFAULT_OG_IMAGE.height,
    ...(base.alt ? { alt: base.alt } : {}),
  };
}

export type BasicMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: OgImageInput;
  robots?: Metadata["robots"];
  openGraphType?: OpenGraphMetadata["type"];
};

export function buildBasicMetadata({
  title,
  description,
  path = "/",
  keywords,
  image,
  robots,
  openGraphType = "website",
}: BasicMetadataInput): Metadata {
  const ogImage = normalizeOgImage(image);

  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: openGraphType,
      title,
      description,
      url: path,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };

  if (keywords?.length) metadata.keywords = keywords;
  if (robots) metadata.robots = robots;

  return metadata;
}

export type ArticleMetadataInput = BasicMetadataInput & {
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  section?: string | null;
  tags?: string[];
};

export function buildArticleMetadata({
  publishedTime,
  modifiedTime,
  authors,
  section,
  tags,
  ...rest
}: ArticleMetadataInput): Metadata {
  const metadata = buildBasicMetadata({
    ...rest,
    openGraphType: "article",
  });

  metadata.openGraph = metadata.openGraph ?? {};
  metadata.openGraph.type = "article";

  if (publishedTime || modifiedTime || authors?.length || section || tags?.length) {
    metadata.openGraph.article = {
      publishedTime: publishedTime ?? undefined,
      modifiedTime: modifiedTime ?? undefined,
      authors,
      section: section ?? undefined,
      tags,
    };
  }

  if (authors?.length) {
    metadata.openGraph = {
      ...metadata.openGraph,
      authors,
    };
  }

  return metadata;
}

export type CollectionMetadataInput = BasicMetadataInput & {
  collectionUrl?: string;
  image?: OgImageInput;
};

export function buildCollectionMetadata(input: CollectionMetadataInput): Metadata {
  return buildBasicMetadata({
    ...input,
    openGraphType: "website",
  });
}

export type ProfileMetadataInput = BasicMetadataInput & {
  profile?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    gender?: "male" | "female";
  };
};

export function buildProfileMetadata({
  profile,
  ...rest
}: ProfileMetadataInput): Metadata {
  const metadata = buildBasicMetadata({
    ...rest,
    openGraphType: "profile",
  });

  metadata.openGraph = metadata.openGraph ?? {};
  metadata.openGraph.type = "profile";

  if (profile) {
    metadata.openGraph.profile = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      gender: profile.gender,
    };
  }

  return metadata;
}
