import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Manrope, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import Providers from "@/components/Providers";
import { rootMetadata, clinicSchema, websiteSchema } from "@/lib/seo";

// One Latin family across the whole app. Manrope carries headings at 800 and
// body text at 400–600, so hierarchy comes from weight and size rather than
// from mixing a serif with a sans — which reads cleaner in dense panel UI and
// means one less font to load.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Urdu is set in Nastaliq, the calligraphic style Pakistani readers expect —
// the Latin faces above have no Urdu glyphs at all, so without this the whole
// Urdu translation would fall back to a system font. Its metrics are very
// different from Latin type, which is why globals.css treats it separately.
const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Kept for numerals, times, prices and IDs — tabular figures stop numbers
// jittering as they update, and they stay Latin inside Urdu text.
const plexMono = localFont({
  variable: "--font-plex-mono",
  src: [
    { path: "./fonts/IBMPlexMono-Regular.ttf", weight: "400" },
    { path: "./fonts/IBMPlexMono-Medium.ttf", weight: "500" },
  ],
  display: "swap",
});

// Title template, canonical, OpenGraph and robots defaults — every page
// inherits these and overrides only what differs. See lib/seo.ts.
export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
  width: "device-width",
  initialScale: 1,
  // The app shell has its own scroll containers; letting the page zoom past
  // this on mobile breaks the fixed bottom nav.
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // lang/dir are set here for the first paint and then kept in sync by
    // LanguageProvider once the saved locale is read from localStorage.
    <html
      lang="en"
      dir="ltr"
      className={`${manrope.variable} ${nastaliq.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full bg-paper text-ink">
        {/* Who the clinic is, where it is, when it's open — emitted on every
            page so any entry point can identify the business. The panels are
            noindex, so there's no cost to having it there too. */}
        <JsonLd data={[clinicSchema(), websiteSchema()]} />

        {/* Every provider, the header/footer chrome and the toaster live in one
            client component. They used to be nested here, which made six
            separate client references for the server to resolve out of the
            build's manifest — see the note in Providers.tsx. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
