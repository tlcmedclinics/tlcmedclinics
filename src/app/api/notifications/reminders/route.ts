import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { notify, notifyAllAdmins } from "@/lib/notifications";
import type { Appointment } from "@/types";

// GET /api/notifications/reminders — meant to be hit by an external cron
// (Vercel Cron / cron-job.org) every ~15 minutes, not called from the UI.
// Finds confirmed appointments starting in the next 24h that haven't been
// reminded yet, and notifies patient + doctor + admin in real time.
//
// Protect it with CRON_SECRET in .env — set the same value as the
// Authorization: Bearer <secret> header on the cron job.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    const snap = await adminDb.collection("appointments").where("status", "==", "confirmed").get();
    const appointments = snap.docs.map((d) => d.data() as Appointment);

    const due = appointments.filter((a) => {
      if (a.reminderSentAt) return false;
      const when = new Date(`${a.date}T${a.time}:00`);
      return when > now && when <= in24h;
    });

    for (const a of due) {
      const message = `Reminder: ${a.service} appointment on ${a.date} at ${a.time}.`;
      const tasks = [
        notify({
          userId: a.patientId,
          role: "patient",
          type: "appointment-reminder",
          title: "Upcoming appointment",
          message,
          appointmentId: a.id,
        }),
      ];
      if (a.doctorId) {
        tasks.push(
          notify({
            userId: a.doctorId,
            role: "doctor",
            type: "appointment-reminder",
            title: "Upcoming appointment",
            message: `${message} Patient: ${a.patientName}.`,
            appointmentId: a.id,
          })
        );
      }
      tasks.push(
        notifyAllAdmins({
          type: "appointment-reminder",
          title: "Upcoming appointment",
          message: `${message} Patient: ${a.patientName}${a.doctorName ? `, Dr. ${a.doctorName}` : ""}.`,
          appointmentId: a.id,
        })
      );
      await Promise.all(tasks);
      await adminDb.collection("appointments").doc(a.id).update({
        reminderSentAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, remindersSent: due.length });
  } catch (err) {
    console.error("[GET /api/notifications/reminders]", err);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
