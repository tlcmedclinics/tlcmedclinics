"use client";

import { useEffect, useState } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, string> = {
  sm: "h-8 w-8 text-[0.65rem]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-xl",
};

type Props = {
  name?: string | null;
  photoURL?: string | null;
  size?: Size;
  className?: string;
};

/**
 * The one place an avatar is rendered.
 *
 * Rule: if a photo exists, the photo shows — the initial is only ever a
 * fallback for someone who hasn't uploaded one. This used to be re-implemented
 * inline in the header, the shell and the settings form, which is how a user
 * with a photo could still end up looking at a letter on one screen.
 *
 * A broken or expired image URL falls back to the initial rather than showing
 * a torn-image icon.
 */
export default function Avatar({ name, photoURL, size = "md", className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  // A new URL deserves a fresh attempt — otherwise replacing a broken photo
  // would keep showing the initial until a reload.
  useEffect(() => {
    setFailed(false);
  }, [photoURL]);

  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const showPhoto = Boolean(photoURL) && !failed;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo font-bold text-white ${SIZES[size]} ${className}`}
    >
      {showPhoto ? (
        // Cloudinary URLs are already sized/optimised on their side, and
        // next/image would need every future host allow-listed to render one.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoURL as string}
          alt={name ?? ""}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );
}
