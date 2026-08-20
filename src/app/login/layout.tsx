import type { Metadata } from "next";

/**
 * Auth screens are noindex.
 *
 * robots.txt already asks crawlers not to fetch them, but a disallowed URL can
 * still be indexed from an inbound link — Google indexes it without having read
 * it, which produces a bare, useless result under the clinic's name. `noindex`
 * is the instruction that actually keeps it out.
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
