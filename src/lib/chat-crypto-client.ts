// Browser-side half of the chat encryption scheme — see chat-crypto.ts for
// the full model. This never touches the master secret; it only ever
// receives a single thread-scoped raw key (32 bytes) from the server.

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export async function importThreadKey(base64Key: string): Promise<CryptoKey> {
  const raw = fromBase64(base64Key);
  return crypto.subtle.importKey("raw", raw.slice().buffer, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptChatText(
  key: CryptoKey,
  plainText: string
): Promise<{ cipherText: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, encoded);
  return { cipherText: toBase64(cipherBuf), iv: toBase64(iv) };
}

export async function decryptChatText(
  key: CryptoKey,
  cipherText: string,
  iv: string
): Promise<string> {
  try {
    const cipherBuf = fromBase64(cipherText);
    const ivBuf = fromBase64(iv);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuf.buffer as ArrayBuffer },
      key,
      cipherBuf.buffer as ArrayBuffer
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return "[Unable to decrypt this message]";
  }
}
