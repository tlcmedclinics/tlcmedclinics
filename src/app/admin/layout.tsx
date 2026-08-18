"use client";

import AppShell, { icons, type NavItem } from "@/components/AppShell";

const nav: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "nav.overview", icon: icons.overview },
  { href: "/admin/appointments", labelKey: "nav.appointments", icon: icons.calendar },
  { href: "/admin/slots", labelKey: "nav.slots", icon: icons.clock },
  { href: "/admin/doctors", labelKey: "nav.doctors", icon: icons.stethoscope },
  { href: "/admin/services", labelKey: "nav.services", icon: icons.doc },
  { href: "/admin/coupons", labelKey: "nav.coupons", icon: icons.tag },
  { href: "/admin/blogs", labelKey: "nav.blogs", icon: icons.doc },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="admin" nav={nav}>
      {children}
    </AppShell>
  );
}
