"use client";

import type { ReactNode } from "react";
import SiteChrome from "@/components/SiteChrome";
import Toaster from "@/components/Toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/contexts/ToastContext";

/**
 * Everything the whole app is wrapped in, as ONE client component.
 *
 * The root layout used to nest all six of these itself — LanguageProvider,
 * ToastProvider, AuthProvider, ConfirmProvider, SiteChrome and Toaster. Because
 * layout.tsx is a server component, each one written there is a separate client
 * reference the server has to look up in the build's client manifest, and every
 * build was dying on the lookup for one of them:
 *
 *   Error occurred prerendering page "/_not-found"
 *   Could not find the module ".../SiteChrome.tsx#default" in the React
 *   Client Manifest.
 *
 * Collapsing them here leaves the server with exactly one client reference to
 * resolve instead of six. The nesting is unchanged — the same providers in the
 * same order — but from the server's side this is a single boundary, and
 * everything inside it is ordinary client-to-client rendering.
 *
 * The order matters and is deliberate:
 *   · LanguageProvider outermost, because every label below it translates.
 *   · ConfirmProvider inside AuthProvider, so a confirmation can be raised from
 *     anywhere a signed-in action can be taken — logout included.
 *   · Toaster a sibling of ConfirmProvider rather than a child, so a toast
 *     survives a confirmation dialog closing.
 *
 * `children` is still server-rendered content. Passing it through a client
 * component doesn't change that — React serialises it and slots it in.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <ConfirmProvider>
            <SiteChrome>{children}</SiteChrome>
          </ConfirmProvider>
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
