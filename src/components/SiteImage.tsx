"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

/**
 * A photograph that cannot break the page.
 *
 * next/image renders a broken-image glyph and an alt string when the file
 * behind `src` isn't there. On a clinic's home page that reads as neglect, and
 * it is a realistic failure here: the images were exported from the old Care
 * Life site with names like "skin_care-min-860x645.jpg", and one wrong
 * extension is enough. When the load fails this draws a tinted panel in the
 * clinic's own colours instead — quiet, and clearly deliberate.
 *
 * Always used with `fill`, so the caller owns the aspect ratio and the rounding
 * through the wrapping element. That keeps the fallback exactly the same shape
 * as the picture it replaces, which is why the layout doesn't move when one
 * fails.
 *
 * ── Why there is a `style` prop as well as `className` ──
 * Tailwind only builds the classes it can find written out in the source, and
 * in this project a class that appears nowhere else has a habit of not being
 * built at all until the dev server is restarted — which shows up as a picture
 * that ignores its own object-fit and sits in the wrong place, with no error
 * anywhere. For the one or two callers that need a fit or a position no other
 * component uses, `style` says it in CSS the browser cannot fail to receive.
 * Everything else should keep using `className`.
 */
export default function SiteImage({
  src,
  alt,
  sizes,
  className = "object-cover",
  style,
  priority,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        // Decorative once it is no longer a photograph: the alt text describes
        // an image that isn't being shown, so announcing it would be a lie.
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(135deg,var(--indigo-deep)_0%,var(--indigo)_55%,var(--crimson)_140%)] opacity-[0.14]"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
