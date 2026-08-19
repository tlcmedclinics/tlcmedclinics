"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A full-screen overlay that is genuinely full-screen.
 *
 * `position: fixed` is only relative to the viewport when no ancestor has a
 * transform, filter or backdrop-filter — any of those turn that ancestor into
 * the containing block instead. This app trips that constantly:
 *
 *   - `.animate-fade-up` wraps most pages and ends on `transform: translateY(0)`
 *     with `fill-mode: both`, so the transform never goes away.
 *   - The sticky top bars use `backdrop-blur`.
 *
 * Both were quietly pinning the chat and call panels to the page box instead
 * of the screen, which is why the composer ended up far below the fold. Going
 * through a portal to <body> sidesteps the whole category of problem, so every
 * overlay should use this rather than its own `fixed inset-0`.
 *
 * Also owns the behaviour every overlay needs: background scroll lock and
 * Escape to close.
 */
export default function Overlay({
  onClose,
  children,
  className = "",
  labelledBy,
}: {
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  // Portals need a document, which doesn't exist during server rendering.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!onClose) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      // `dvh`, not `vh`: on mobile browsers `vh` is the tallest possible
      // viewport, so a `100vh` panel sits partly under the address bar and the
      // composer falls off the bottom of the screen.
      className={`fixed inset-0 z-[80] flex h-[100dvh] w-screen ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}
