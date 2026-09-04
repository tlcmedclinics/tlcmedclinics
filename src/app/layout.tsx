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
//
// `preload: false` is the important line, and it is worth a paragraph.
//
// Nastaliq is an enormous typeface. Every letter changes shape depending on
// what sits either side of it, so the font carries thousands of contextual
// forms rather than the couple of hundred glyphs a Latin face needs — it is
// one of the largest fonts Google serves. next/font preloads by default, which
// meant every visitor downloaded four weights of it before the page could
// finish painting. Most of them are reading English and will never see a
// single Urdu character.
//
// Without preloading, the browser fetches it only when it actually has to draw
// an Urdu glyph — which is exactly when the reader has switched to Urdu. They
// still get it, one moment later, and `display: "swap"` means they read the
// page in a fallback face while it arrives instead of staring at blank space.
//
// The font is still declared here, and the CSS variable still works. Nothing
// about how Urdu looks has changed. What changed is who pays for it.
const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

// Kept for numerals, times, prices and IDs — tabular figures stop numbers
// jittering as they update, and they stay Latin inside Urdu text.
//
// These were the shipped .ttf files: 1,033 glyphs each, 272 KB for the pair,
// preloaded on every page. This font is only ever asked to draw digits, a
// handful of punctuation marks and the odd Latin word beside them — "AM",
// "PKR", a reference code — so the other nine hundred glyphs were pure freight.
//
// Subset to what is actually used and re-encoded as WOFF2 they are 165 glyphs
// and 21 KB for the pair. Same typeface, same numerals, 93% less to download,
// and it is on the critical path because the phone number in the header is set
// in it.
//
// If a new screen ever needs a character these are missing, it will fall back
// to the body face for that character rather than break. Regenerate from the
// original TTFs if that starts to show.
const plexMono = localFont({
  variable: "--font-plex-mono",
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400" },
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500" },
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
