import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import type { UserRole } from "@/types";

export async function verifyRequest(
  req: NextRequest,
  allowedRoles?: UserRole[]
) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { error: "Missing auth token", status: 401 as const };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const role = (decoded.role as UserRole | undefined) ?? undefined;

    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
      return { error: "Forbidden", status: 403 as const };
    }

    return { uid: decoded.uid, role };
  } catch {
    return { error: "Invalid or expired token", status: 401 as const };
  }
}
