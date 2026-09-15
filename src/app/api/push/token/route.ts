import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-server";
import { deleteToken, saveToken } from "@/lib/push";

/**
 * Where the app registers the phone it wants notifications on.
 *
 * POST   { token, platform }  — after signing in, and again whenever Firebase
 *                               rotates the token (which it does on its own
 *                               schedule, without asking).
 * DELETE { token }            — on sign out. A phone that has been handed back
 *                               or sold must stop receiving a stranger's
 *                               appointment reminders, and that is not
 *                               something to leave until the token expires.
 *
 * Authenticated, and the uid comes from the verified token rather than from
 * the request body. Without that, anyone could register their own phone
 * against somebody else's uid and quietly receive that person's medical
 * appointment notifications — the body is not a place to say who you are.
 */

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform.trim() : undefined;

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  try {
    await saveToken(auth.uid, token, platform);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/push/token]", err);
    return NextResponse.json({ error: "Could not register for notifications." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  try {
    await deleteToken(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/push/token]", err);
    return NextResponse.json({ error: "Could not unregister." }, { status: 500 });
  }
}
