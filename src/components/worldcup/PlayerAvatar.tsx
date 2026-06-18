"use client";

import Image from "next/image";
import { useState } from "react";
import { TeamFlag } from "./TeamFlag";

/** Iniciales (max 2) a partir del nombre. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Gradiente determinista por nombre (consistente entre render servidor/cliente). */
const GRADIENTS = [
  "from-wc-blue/40 to-wc-purple/30",
  "from-wc-purple/40 to-wc-pink/30",
  "from-wc-green/40 to-wc-blue/30",
  "from-wc-red/35 to-wc-gold/25",
  "from-wc-gold/35 to-wc-green/25",
  "from-wc-pink/35 to-wc-blue/30",
];
function gradientFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/**
 * Avatar de jugador estilo premium. Si hay imageUrl valida la muestra
 * (next/image, lazy); si no, cae a iniciales sobre gradiente + bandera de
 * la seleccion en una esquina. Nunca se rompe si falta la imagen.
 */
export function PlayerAvatar({
  name,
  teamId,
  imageUrl,
  size = 48,
  glow = false,
  showFlag = true,
  className = "",
}: {
  name: string;
  teamId: string;
  imageUrl?: string | null;
  size?: number;
  glow?: boolean;
  showFlag?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ring = glow ? "ring-2 ring-wc-gold/70 shadow-wc-gold" : "ring-1 ring-white/10";
  const flagSize = Math.max(12, Math.round(size * 0.34));

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className={`h-full w-full overflow-hidden rounded-full ${ring}`}>
        {imageUrl && !failed ? (
          <Image
            src={imageUrl}
            alt={name}
            width={size}
            height={size}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(name)} font-bold text-white`}
            style={{ fontSize: Math.round(size * 0.36) }}
            aria-label={name}
          >
            {initials(name)}
          </div>
        )}
      </div>
      {showFlag ? (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-wc-bg p-[1px] ring-1 ring-black/40">
          <TeamFlag teamId={teamId} size={flagSize} rounded="rounded-full" />
        </span>
      ) : null}
    </div>
  );
}
