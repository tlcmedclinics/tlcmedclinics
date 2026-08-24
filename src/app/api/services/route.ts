import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Service } from "@/types";

/**
 * A number from a form field, or undefined.
 *
 * An empty input arrives as "" and has to stay absent rather than becoming 0.
 * For `advancePayment` those mean opposite things — absent is "charge the full
 * price online", zero is "charge nothing at all" — and Number("") is 0, which
 * is exactly the trap.
 */
export function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const snap = await adminDb.collection("services").orderBy("order", "asc").get();
  return NextResponse.json(snap.docs.map((d) => d.data()));
}

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.name || !body.category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ref = adminDb.collection("services").doc();
  const now = new Date().toISOString();
  const countSnap = await adminDb.collection("services").count().get();

  const service: Service = {
    id: ref.id,
    slug: `${slugify(body.name)}-${ref.id.slice(0, 6)}`,
    category: body.category,
    name: body.name,
    short: body.short ?? "",
    intro: body.intro ?? "",
    points: Array.isArray(body.points)
      ? body.points
      : String(body.points ?? "")
          .split("\n")
          .map((p: string) => p.trim())
          .filter(Boolean),
    treatments: Array.isArray(body.treatments)
      ? body.treatments
      : String(body.treatments ?? "")
          .split("\n")
          .map((t: string) => t.trim())
          .filter(Boolean),
    price: optionalNumber(body.price),
    advancePayment: optionalNumber(body.advancePayment),
    durationMinutes: optionalNumber(body.durationMinutes),
    image: body.image || undefined,
    order: countSnap.data().count,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(service);
  return NextResponse.json({ ok: true, service });
}
