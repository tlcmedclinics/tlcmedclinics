import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { BlogPost } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  let query: FirebaseFirestore.Query = adminDb
    .collection("blogs")
    .orderBy("createdAt", "desc");

  if (all) {
    const auth = await verifyRequest(req, ["admin"]);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  } else {
    query = query.where("published", "==", true);
  }

  const snap = await query.get();
  return NextResponse.json(snap.docs.map((d) => d.data()));
}

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.title || !body.content) {
    return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
  }

  const ref = adminDb.collection("blogs").doc();
  const now = new Date().toISOString();
  const slug = String(body.title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const post: BlogPost = {
    id: ref.id,
    title: body.title,
    slug: `${slug}-${ref.id.slice(0, 6)}`,
    excerpt: body.excerpt ?? "",
    content: body.content,
    coverImage: body.coverImage ?? undefined,
    authorName: body.authorName ?? "TLC Med Clinics",
    published: Boolean(body.published),
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(post);
  return NextResponse.json({ ok: true, post });
}
