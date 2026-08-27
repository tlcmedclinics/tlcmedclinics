import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-server";

/**
 * Machine translation, offered to the admin panel as a *draft*.
 *
 * What this is not: a translation layer. Nothing here writes to the database
 * and nothing on the public site calls it. It fills an Urdu box in a form so
 * the person filling that form has something to correct instead of a blank
 * field, and they still have to read it and press save.
 *
 * That distinction is the whole design. This is a clinic: "Persistent
 * Depressive Disorder" and "Ketamine Therapy" are clinical terms whose Urdu a
 * translation API will render plausibly and sometimes wrongly, and a wrong
 * translation of a treatment name does not look wrong — it looks like a
 * translation. A patient cannot tell. The clinic can, which is why the clinic
 * is the last step and not the API.
 *
 * Switched on by TRANSLATE_API_KEY (a Google Cloud Translation key). Without
 * it this route answers 503 and the admin panel simply doesn't show the
 * button — the Urdu boxes are still there to type into by hand, which is the
 * more accurate way anyway.
 */

const ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

/** One request's worth. Enough for a service's five fields, not for a book. */
const MAX_TEXTS = 25;
const MAX_CHARS = 8000;

export async function POST(req: NextRequest) {
  // Admin only. This spends money per character on someone else's API key,
  // and there is no reason a patient's browser should be able to.
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const apiKey = process.env.TRANSLATE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Machine translation isn't configured. Type the Urdu by hand." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const texts: string[] = Array.isArray(body.texts)
    ? body.texts.filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  if (texts.length === 0) {
    return NextResponse.json({ error: "Nothing to translate." }, { status: 400 });
  }
  if (texts.length > MAX_TEXTS) {
    return NextResponse.json({ error: "Too many fields at once." }, { status: 400 });
  }
  const totalChars = texts.reduce((n, t) => n + t.length, 0);
  if (totalChars > MAX_CHARS) {
    return NextResponse.json(
      { error: "That's too much text for one go — translate the long fields separately." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        source: "en",
        target: "ur",
        // The clinic's copy is plain prose, not markup. Asking for text
        // stops the API escaping punctuation into HTML entities that would
        // then be saved into Firestore as literal "&amp;".
        format: "text",
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[translate] upstream refused", res.status, detail);
      return NextResponse.json(
        { error: "The translation service refused that. Please type the Urdu by hand." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      data?: { translations?: { translatedText?: string }[] };
    };
    const out = (data.data?.translations ?? []).map((t) => t.translatedText ?? "");

    // Positional: the caller maps these back onto its own fields by index, so
    // a short array would silently shift every translation onto the wrong box.
    if (out.length !== texts.length) {
      console.error("[translate] length mismatch", texts.length, out.length);
      return NextResponse.json(
        { error: "The translation came back incomplete — please type the Urdu by hand." },
        { status: 502 }
      );
    }

    return NextResponse.json({ translations: out });
  } catch (err) {
    console.error("[translate]", err);
    return NextResponse.json(
      { error: "Could not reach the translation service." },
      { status: 502 }
    );
  }
}
