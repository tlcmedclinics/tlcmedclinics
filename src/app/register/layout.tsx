import type { Metadata } from "next";

/** Registration is noindex for the same reason as sign-in — see login/layout.tsx. */
export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
