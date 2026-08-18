"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

// The public site and the signed-in panels want different chrome: marketing
// pages get the header, footer and WhatsApp button; the patient/doctor/admin
// panels get the app shell instead and would look broken with a second nav
// stacked on top.
//
// Route groups would express this in the file tree, but that means moving
// every page. This keeps the routes where they are and decides at render.
const PANEL_PREFIXES = ["/patient", "/doctor", "/admin"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isPanel = PANEL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isPanel) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
