// components/MediaFrame.tsx
"use client";

import Image, { ImageProps } from "next/image";
import { CSSProperties } from "react";

type Props = {
  /** e.g. "4 / 3", "16 / 9", "1 / 1" */
  ratio?: `${number} / ${number}`;
  /** optional extra classes applied to outer frame */
  className?: string;
  /** sizes attr tuned per grid */
  sizes?: string;
} & Pick<ImageProps, "src" | "alt" | "priority">;

export default function MediaFrame({
  ratio = "4 / 3",
  className = "",
  sizes = "(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw",
  src,
  alt,
  priority,
}: Props) {
  const style: CSSProperties = { aspectRatio: ratio }; // native, CLS-free
  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-100 ${className}`}
      style={style}
    >
      {/* Fill keeps layout fixed; object-cover prevents reflow */}
      <Image fill src={src} alt={alt} sizes={sizes} className="object-cover" priority={priority} />
    </div>
  );
}