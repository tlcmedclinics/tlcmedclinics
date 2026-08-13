import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendMail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, service, preferredDate, preferredTime, message } = body;

  if (!name || !phone || !service) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const inquiry = {
    name,
    phone,
    email: email || null,
    service,
    preferredDate: preferredDate || null,
    preferredTime: preferredTime || null,
    message: message || null,
    createdAt: new Date().toISOString(),
  };

  await adminDb.collection("inquiries").add(inquiry);

  sendMail({
    subject: "New website inquiry",
    text: `${name} (${phone}) asked about ${service}.\n${message ?? ""}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
