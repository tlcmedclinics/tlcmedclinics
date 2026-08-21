"use client";

import AppShell, { icons, type NavItem } from "@/components/AppShell";

const nav: NavItem[] = [
  { href: "/doctor/dashboard", labelKey: "nav.overview", icon: icons.overview },
  { href: "/doctor/appointments", labelKey: "nav.appointments", icon: icons.calendar },
  // The same clock icon the admin slots page uses — it is the same job, seen
  // from one doctor's side.
  { href: "/doctor/slots", labelKey: "nav.slots", icon: icons.clock },
  { href: "/doctor/patients", labelKey: "nav.patients", icon: icons.users },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="doctor" nav={nav}>
      {children}
    </AppShell>
  );
}
