"use client";

import Image from "next/image";
import { useState } from "react";
import { flagEmojiForTeam, flagUrlForTeam, type FlagSize } from "@/lib/flags";

/**
 * Bandera de seleccion. Usa FlagCDN (next/image, lazy) con crop centrado y
 * bordes redondeados; si la imagen falla o no hay ISO, cae al emoji.
 */
export function TeamFlag({
  teamId,
  size = 22,
  rounded = "rounded-[3px]",
  className = "",
  title,
}: {
  teamId: string;
  /** Alto en px (el ancho se calcula 4:3). */
  size?: number;
  rounded?: string;
  className?: string;
  title?: string;
}) {
  const [failed, setFailed] = useState(false);
  const cdnSize: FlagSize = size <= 24 ? "w40" : size <= 48 ? "w80" : "w160";
  const url = flagUrlForTeam(teamId, cdnSize);
  const w = Math.round((size * 4) / 3);

  if (!url || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center leading-none ${className}`}
        style={{ fontSize: size }}
        title={title}
        aria-hidden
      >
        {flagEmojiForTeam(teamId)}
      </span>
    );
  }

  return (
    <Image
      src={url}
      alt=""
      width={w}
      height={size}
      title={title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`inline-block object-cover ring-1 ring-black/30 ${rounded} ${className}`}
      style={{ width: w, height: size }}
    />
  );
}
