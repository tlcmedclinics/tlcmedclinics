"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import RequireRole from "@/components/RequireRole";
import { auth } from "@/lib/firebase/client";
import { useToast } from "@/contexts/ToastContext";
import NotificationBell from "@/components/NotificationBell";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/slots", label: "Slots" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/blogs", label: "Blogs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  async function handleLogout() {
    try {
      await signOut(auth);
      toast.success("Logged out.");
      router.push("/login");
    } catch {
      toast.error("Couldn't log out. Please try again.");
    }
  }

  return (
    <RequireRole role="admin">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[200px_1fr]">
        <aside className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="eyebrow text-indigo">Admin</p>
              <NotificationBell />
            </div>
            <nav className="mt-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname === link.href
                      ? "bg-indigo text-white"
                      : "text-ink-soft hover:bg-mist"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="mt-8 rounded-lg border border-line px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:border-crimson hover:text-crimson-deep"
          >
            Log out
          </button>
        </aside>
        <div>{children}</div>
      </div>
    </RequireRole>
  );
}
