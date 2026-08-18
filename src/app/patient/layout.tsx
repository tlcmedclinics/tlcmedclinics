"use client";

import AppShell, { icons, type NavItem } from "@/components/AppShell";

const nav: NavItem[] = [
  { href: "/patient/dashboard", labelKey: "nav.dashboard", icon: icons.overview },
  { href: "/patient/book", labelKey: "nav.book", icon: icons.plus },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="patient" nav={nav}>
      {children}
    </AppShell>
  );
}
