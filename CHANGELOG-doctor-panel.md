# CHANGELOG — Doctor panel, real chat encryption, Urdu/English

## What's new

### 1. Doctor role & panel (`/doctor/*`)
- New `doctor` role alongside `patient`/`admin`. Doctors are created **only**
  by admin (Admin → Doctors page, or `npm run create-doctor -- <email> <password> "Name" "Specialization"`).
- `/doctor/dashboard` — stat cards (today's sessions, upcoming, patients, completed) + today's schedule.
- `/doctor/appointments` — same host controls admin had (start/join/end video or chat), but
  **scoped to only that doctor's assigned patients** at the API and Firestore-rules level.
- `/doctor/patients` — patient roster derived from their appointment history.
- Admin's Appointments page now has a doctor-assignment dropdown per booking.
- Admin → Doctors: create/list/suspend doctor accounts (suspend disables Firebase Auth login entirely).

### 2. Real message encryption (chat was previously plaintext in Firestore)
The bundled ThePsy reference app derived its AES key from `conversationId + a
hardcoded public salt` — both values are visible in the client bundle, so
that scheme gives no real protection. This project uses a different model:

- `CHAT_ENCRYPTION_KEY` — a server-only secret (never sent to the browser).
- Each thread's AES-GCM key = `HMAC-SHA256(CHAT_ENCRYPTION_KEY, threadId)`, computed server-side.
- `/api/chat/[threadId]/key` re-checks (via Firebase Admin) that the caller is
  the patient, the *assigned* doctor, or admin on that appointment before
  handing out the key — knowing the threadId alone decrypts nothing.
- The browser encrypts/decrypts locally with the Web Crypto API
  (`src/lib/chat-crypto-client.ts`); Firestore only ever stores ciphertext + IV.
- **Action required:** generate a key and set it before deploying:
  `openssl rand -base64 32` → `CHAT_ENCRYPTION_KEY` in `.env.local`. Losing/rotating
  this key makes old messages permanently undecryptable, so store it in your
  secrets manager, not just `.env.local`.

### 3. Urdu / English language toggle
- Lightweight custom `LanguageContext` (`src/contexts/LanguageContext.tsx`) — no heavy
  i18n library, just a flat dictionary (`src/i18n/dictionaries.ts`) and a `useT()` hook.
- Toggle pill in the header; switching also flips `<html dir="rtl">` for Urdu.
- Wired into chat, video call, doctor panel, and patient dashboard so far.
  Extending coverage to admin pages / marketing pages is just adding more
  `dictionaries.ts` keys and swapping hardcoded strings for `t("...")`.

### 4. Dashboard visual pass
- Patient dashboard now leads with stat cards (upcoming count, completed count,
  "next up") instead of just a bare list, and shows the assigned doctor's name.
- Doctor dashboard follows the same stat-card pattern.
- Both now show a small 🔒 "secured with per-session encryption" line.

## Firestore rules
`firestore.rules` updated: doctors can only read/update appointments and chat
threads where `doctorId == their uid`; only admin can (re)assign a doctor.
**Deploy these rules** (`firebase deploy --only firestore:rules`) alongside the
code — the API routes enforce this too, but rules are the real backstop if
someone bypasses the API.

## Still open / recommended next steps
- Extend Urdu translations to admin, blog, and marketing pages.
- Add an admin/doctor audit log for who read/joined which session (compliance).
- Consider Firestore-level rate limiting or App Check to slow down abuse of
  the `/api/chat/[threadId]/key` endpoint beyond normal auth.
- The homepage does server-side Firestore reads at build time — a real
  `FIREBASE_*` service account is required to `next build` (same as before
  these changes, not a regression).
