"use client";

import AppShell, { icons, type NavItem } from "@/components/AppShell";

const nav: NavItem[] = [
  { href: "/doctor/dashboard", labelKey: "nav.overview", icon: icons.overview },
  { href: "/doctor/appointments", labelKey: "nav.appointments", icon: icons.calendar },
  { href: "/doctor/patients", labelKey: "nav.patients", icon: icons.users },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="doctor" nav={nav}>
      {children}
    </AppShell>
  );
}
