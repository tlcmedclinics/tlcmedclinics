import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { UR_SUFFIX, translationProgress } from "@/lib/bilingual";

/**
 * Fills in the missing Urdu across everything already in the database.
 *
 * The forms translate one field at a time, which is the right shape for a
 * service being written now and the wrong shape for the fifteen that were
 * written before the Urdu columns existed. This does those in one pass.
 *
 * ── What it writes, and what it admits to ──
 * Every field it fills is stamped `urSource: "machine"`. That flag is the
 * point of the whole route. A machine translation of "Persistent Depressive
 * Disorder" is fluent and can be clinically wrong, and once it is sitting in
 * the database it is indistinguishable from one a doctor wrote — unless
 * something says which is which. The admin list reads this flag and marks
 * those services as needing a read; opening one and saving it clears the flag,
 * because a human has now looked.
 *
 * It never overwrites. A field with Urdu already in it is skipped whatever its
 * source, so running this twice cannot undo an afternoon of corrections.
 *
 * GET reports what would be done, POST does it. The admin page calls GET on
 * load so the button can say "23 fields across 6 services" rather than asking
 * someone to press it to find out.
 */

type Job = {
  collection: string;
  /** The fields worth translating, in the order they'll be sent. */
  fields: string[];
  label: string;
};

const JOBS: Record<string, Job> = {
  services: {
    collection: "services",
    fields: ["name", "short", "intro", "points", "treatments"],
    label: "Services",
  },
  blogs: {
    collection: "blogs",
    fields: ["title", "excerpt", "content"],
    label: "Blog posts",
  },
};

const ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

/** Google's own cap is 128 strings and 30k characters; well under both. */
const BATCH_TEXTS = 20;
const BATCH_CHARS = 6000;

type Pending = { docId: string; field: string; isList: boolean; texts: string[] };

/** Everything that has English but no Urdu yet. */
async function findPending(job: Job): Promise<Pending[]> {
  const snap = await adminDb.collection(job.collection).get();
  const out: Pending[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    for (const field of job.fields) {
      const en = data[field];
      const ur = data[`${field}${UR_SUFFIX}`];

      const isList = Array.isArray(en);
      const hasEnglish = isList ? en.length > 0 : Boolean(String(en ?? "").trim());
      const hasUrdu = Array.isArray(ur) ? ur.length > 0 : Boolean(String(ur ?? "").trim());
      if (!hasEnglish || hasUrdu) continue;

      out.push({
        docId: doc.id,
        field,
        isList,
        texts: isList ? (en as string[]).map(String) : [String(en)],
      });
    }
  }
  return out;
}

async function translateBatch(texts: string[], apiKey: string): Promise<string[]> {
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, source: "en", target: "ur", format: "text" }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Translation refused (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    data?: { translations?: { translatedText?: string }[] };
  };
  const out = (data.data?.translations ?? []).map((t) => t.translatedText ?? "");

  // Results are matched back by position. A short array would shift every
  // translation onto the wrong field, which is the kind of corruption nobody
  // notices until a patient reads a treatment name that belongs to another
  // treatment.
  if (out.length !== texts.length) {
    throw new Error(`Translation returned ${out.length} of ${texts.length} strings`);
  }
  return out;
}

export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const report: Record<string, unknown> = {
    configured: Boolean(process.env.TRANSLATE_API_KEY?.trim()),
  };

  for (const [key, job] of Object.entries(JOBS)) {
    try {
      const pending = await findPending(job);
      const snap = await adminDb.collection(job.collection).get();

      let done = 0;
      let total = 0;
      let machineDrafted = 0;
      for (const doc of snap.docs) {
        const p = translationProgress(doc.data(), job.fields);
        done += p.done;
        total += p.total;
        if (doc.data().urSource === "machine") machineDrafted += 1;
      }

      report[key] = {
        label: job.label,
        documents: snap.size,
        fieldsTranslated: done,
        fieldsTotal: total,
        fieldsPending: pending.length,
        charactersPending: pending.reduce(
          (n, p) => n + p.texts.reduce((m, t) => m + t.length, 0),
          0
        ),
        needsReview: machineDrafted,
      };
    } catch (err) {
      console.error(`[backfill] could not read ${job.collection}`, err);
      report[key] = { label: job.label, error: "Could not read this collection." };
    }
  }

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const apiKey = process.env.TRANSLATE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "TRANSLATE_API_KEY isn't set on the server." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const job = JOBS[String(body.collection ?? "")];
  if (!job) {
    return NextResponse.json({ error: "Unknown collection." }, { status: 400 });
  }

  let pending: Pending[];
  try {
    pending = await findPending(job);
  } catch (err) {
    console.error("[backfill] read failed", err);
    return NextResponse.json({ error: "Could not read that collection." }, { status: 503 });
  }

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, translated: 0, documents: 0 });
  }

  // Flattened so several short fields share one API call. Sending each field
  // separately would work and would make thirty round trips for what fits in
  // three.
  const flat: { p: Pending; index: number; text: string }[] = [];
  for (const p of pending) {
    p.texts.forEach((text, index) => flat.push({ p, index, text }));
  }

  const results = new Map<Pending, string[]>();
  for (const p of pending) results.set(p, new Array(p.texts.length).fill(""));

  try {
    let batch: typeof flat = [];
    let chars = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      const out = await translateBatch(
        batch.map((b) => b.text),
        apiKey
      );
      batch.forEach((b, i) => {
        results.get(b.p)![b.index] = out[i];
      });
      batch = [];
      chars = 0;
    };

    for (const item of flat) {
      if (batch.length >= BATCH_TEXTS || chars + item.text.length > BATCH_CHARS) {
        await flush();
      }
      batch.push(item);
      chars += item.text.length;
    }
    await flush();
  } catch (err) {
    console.error("[backfill] translation failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "The translation service failed part-way through. Nothing was saved.",
      },
      { status: 502 }
    );
  }

  // Written only after every batch has come back. A partial write would leave
  // some fields translated and some not, with no record of where it stopped —
  // and the operator would have to guess whether re-running is safe.
  const byDoc = new Map<string, Record<string, unknown>>();
  for (const p of pending) {
    const value = results.get(p)!;
    if (value.some((v) => !v.trim())) continue; // skip anything that came back blank

    const updates = byDoc.get(p.docId) ?? {};
    updates[`${p.field}${UR_SUFFIX}`] = p.isList ? value : value[0];
    byDoc.set(p.docId, updates);
  }

  const writer = adminDb.batch();
  for (const [docId, updates] of byDoc) {
    writer.update(adminDb.collection(job.collection).doc(docId), {
      ...updates,
      // The honesty flag. See the note at the top of this file.
      urSource: "machine",
      urDraftedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await writer.commit();

  return NextResponse.json({
    ok: true,
    translated: [...byDoc.values()].reduce((n, u) => n + Object.keys(u).length, 0),
    documents: byDoc.size,
  });
}
