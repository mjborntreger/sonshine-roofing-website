"use client";

import * as React from "react";
import Image from "next/image";
import Skeleton from "@/components/ui/Skeleton";
import type { WpImage } from "@/lib/content/wp";
import { PROJECT_GALLERY_DEFAULT_HEIGHT, PROJECT_GALLERY_DEFAULT_WIDTH } from "./galleryConfig";

type ProjectGalleryProps = {
  images: WpImage[];
  projectTitle: string;
};

const imageClassBase =
  "pointer-events-none select-none object-cover transition-opacity duration-500 ease-out";

const containerBase = "relative overflow-hidden rounded-2xl bg-slate-100";

export default function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  if (!images.length) return null;

  return (
    <section aria-label="Project Photos" className="space-y-4">
      <h2>Project Photos</h2>
      <div className="grid gap-4 grid-cols-1">
        {images.map((image, index) => (
          <GalleryImage key={`${image.url}-${index}`} image={image} projectTitle={projectTitle} />
        ))}
      </div>
    </section>
  );
}

type GalleryImageProps = {
  image: WpImage;
  projectTitle: string;
};

function GalleryImage({ image, projectTitle }: GalleryImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const width = image.width ?? PROJECT_GALLERY_DEFAULT_WIDTH;
  const height = image.height ?? PROJECT_GALLERY_DEFAULT_HEIGHT;
  const aspectStyle: React.CSSProperties = { aspectRatio: `${width} / ${height}` };
  const alt = image.altText || projectTitle;

  return (
    <div className={containerBase} style={aspectStyle}>
      {!loaded ? <Skeleton className="absolute inset-0 h-full w-full" /> : null}
      <Image
        src={image.url}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={`${imageClassBase} ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoadingComplete={() => setLoaded(true)}
        loading="lazy"
      />
    </div>
  );
}
