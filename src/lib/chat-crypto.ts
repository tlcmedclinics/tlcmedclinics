import { createHmac } from "crypto";

/**
 * Chat encryption model
 * ----------------------
 * Firestore only ever stores ciphertext + IV for a message — never plaintext.
 * The AES-GCM key for a given chat thread is never stored anywhere; it's
 * derived on demand from a server-only master secret (CHAT_ENCRYPTION_KEY,
 * never shipped to the browser) plus the thread id:
 *
 *   threadKey = HMAC-SHA256(masterSecret, threadId)
 *
 * A participant only ever receives their own thread's derived key, and only
 * after /api/chat/[threadId]/key re-checks (server-side, via Firebase Admin)
 * that they're the patient, the assigned doctor, or an admin on that
 * appointment. Knowing a threadId alone is not enough to decrypt anything —
 * unlike a scheme that derives the key from the threadId and a hardcoded
 * public salt, which anyone reading the client bundle could reproduce.
 *
 * The browser then does the actual AES-GCM encrypt/decrypt locally via
 * SubtleCrypto (see src/lib/chat-crypto-client.ts) — the key is held in
 * memory for the session only, never written to localStorage.
 */
export function deriveThreadKey(threadId: string): Buffer {
  const secret = process.env.CHAT_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "CHAT_ENCRYPTION_KEY is not configured — set a long random secret in .env.local before chat can be used."
    );
  }
  return createHmac("sha256", secret).update(threadId).digest();
}
