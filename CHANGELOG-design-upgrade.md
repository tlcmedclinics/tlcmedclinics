# Design upgrade — v3

## Fonts (site-wide)
- Headings: Fraunces → **Newsreader** (editorial serif, Google Font, fetched at your build time — no asset files needed)
- Body: Inter → **Plus Jakarta Sans** (Google Font)
- Mono (labels/eyebrows): unchanged — IBM Plex Mono, still self-hosted locally
- This is a single change in `src/app/layout.tsx` + `src/app/globals.css` — because every page already used the shared
  `.h1-hero / .h1 / .h2 / .h3 / .h4 / .lede / .stat-number / .eyebrow` classes (not per-page font names), the new
  fonts apply across the *entire* app automatically: marketing pages, patient/doctor/admin dashboards, forms, chat — everywhere.
- Removed the old Fraunces/Inter .ttf files from `src/app/fonts/` since they're no longer used.

## New shared button/surface system (`globals.css`)
Added four reusable button classes so every screen can share one consistent look instead of each page
repeating its own Tailwind string:
- `.btn-primary` — crimson filled (main CTAs)
- `.btn-indigo` — indigo filled (secondary strong actions)
- `.btn-outline` — bordered, neutral
- `.btn-ghost` — bordered indigo, fills on hover
- `.surface-card` — the card/shadow/radius combo used for elevated panels

Applied so far to: **Header** (login / dashboard / contact buttons) and **Hero** (Book Appointment / View Services).
The rest of the app's buttons still work exactly as before (same colors, same radius) — you can migrate any other
page to these classes whenever you touch it next; nothing needs to change urgently since the visual result is the same.

## Not touched this pass
- Stripe/PayPal checkout logic, Daily.co video rooms, encrypted chat — all already wired to `process.env` keys from
  before; just drop your real keys into `.env.local` (see `README.md`) and they go live. No code changes needed there.

## Fixed: firebase-admin/Turbopack crash (ERR_REQUIRE_ESM)
`jwks-rsa` (pulled in by `firebase-admin`'s auth module) depends on `jose`, and `jose` v6 dropped CommonJS
support entirely — it's ESM-only now. Turbopack (Next.js 16's default bundler) can't `require()` an ESM-only
package the way `jwks-rsa` tries to, so any route touching `firebase-admin/auth` crashed with:

```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../jose/dist/webapi/index.js ... not supported
```

**Fix applied:** pinned `jose` to `5.9.6` (last version with a proper CJS build) via an `overrides` entry in
`package.json`:
```json
"overrides": { "jose": "5.9.6" }
```
Run `npm install` after pulling this update so the pin takes effect. If you ever bump `firebase-admin` and hit
this again, either bump the override to whatever the newest jose version with CJS support is, or fall back to
running Next.js with `--webpack` instead of Turbopack (Turbopack is stricter about ESM/CJS interop than webpack was).

## Fixed: build crash — "Could not load the default credentials"
This happened because the homepage (`/`) is statically prerendered at build time, and it renders
`ServicesOverview`, which reads from Firestore via `firebase-admin`. If `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, or `FIREBASE_PRIVATE_KEY` aren't set (or aren't visible to the build step) in your
hosting platform (Vercel), `firebase-admin` falls back to Google's Application Default Credentials, which don't
exist in a build environment — hence the crash, which failed the whole `npm run build`.

**Two things fixed:**

1. **Made the Firestore-reading pages resilient** (`ServicesOverview.tsx`, `services/page.tsx`,
   `services/[slug]/page.tsx`): each now wraps its Firestore call in try/catch and degrades gracefully
   (skips the section / shows "no services yet" / 404s) instead of crashing the page or the whole build.
   This protects you from the same class of crash in the future even if Firestore has a bad moment.

2. **What you still need to do:** set these three environment variables in your hosting platform (e.g. Vercel →
   Project Settings → Environment Variables), for Production (and Preview, if you deploy preview branches):
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` — paste it with real newlines, or with `\n` escapes; the code already unescapes
     `\n` on read (see `src/lib/firebase/admin.ts`)

   These three come from your Firebase service account JSON (Firebase Console → Project Settings → Service
   Accounts → Generate new private key). Without them, every `/api` route and every server-rendered page that
   reads Firestore will fail the same way — this build error was just the first one that happened to run at
   build time.
