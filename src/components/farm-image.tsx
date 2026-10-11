"use client";

import Image from "next/image";
import type { SyntheticEvent } from "react";

type FarmImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
};

export function FarmImage({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
  fallbackSrc = "/farm-empty.jpg",
}: FarmImageProps) {
  function useFallback(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;

    if (image.currentSrc.endsWith(fallbackSrc) || image.src.endsWith(fallbackSrc)) {
      return;
    }

    image.removeAttribute("srcset");
    image.src = fallbackSrc;
  }

  return (
    <span className={`farm-image ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={useFallback} />
    </span>
  );
}