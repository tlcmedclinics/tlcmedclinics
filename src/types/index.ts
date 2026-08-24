export type UserRole = "patient" | "doctor" | "admin";

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  // Both identities are optional: a patient can sign up with an email, a
  // phone number, or both, and add the missing one later from Settings. The
  // account is identified by `uid` — never assume either field is present.
  email?: string;
  phone?: string;
  /** True once the number has been through Firebase's OTP check. */
  phoneVerified?: boolean;
  photoURL?: string; // Cloudinary URL
  createdAt: string;

  // ---- Preferences ----
  // Stored on the user doc rather than localStorage so they follow the person
  // from their phone to the clinic desktop. All optional: undefined means
  // "not set yet", and every reader treats that as the sensible default.
  /** Preferred UI language. Falls back to whatever the browser last used. */
  locale?: "en" | "ur";
  /** Chime when a notification arrives. Defaults to on. */
  notificationSound?: boolean;
  /** Tone when a chat message is sent/received. Defaults to on. */
  messageSound?: boolean;
}

export interface PatientProfile extends UserProfile {
  role: "patient";
  dob?: string;
  gender?: string;
}

export interface DoctorProfile extends UserProfile {
  role: "doctor";
  specialization?: string;
  bio?: string;
  active: boolean; // admin can suspend a doctor without deleting the account

  // ---- Presence ----
  // Online status is derived, not stored: the app stamps `lastSeenAt` while the
  // doctor has it open, and `isOnline()` in lib/presence.ts decides from that.
  // There is deliberately no manual "I'm online" switch — a doctor who forgets
  // to flip it off shows as available all night.
  /** Last heartbeat from an active session. Written by PATCH /api/profile. */
  lastSeenAt?: string;
  /** Opt-out from Settings: when false the doctor always reads as offline. */
  presenceVisible?: boolean;
  /** Computed by GET /api/doctors for the client — never written to Firestore. */
  online?: boolean;
  // Self-registered doctors start "pending" and are invisible to patients /
  // cannot log into the doctor dashboard until an admin approves them.
  // Doctors created directly by admin (scripts/create-doctor, admin panel)
  // are "approved" immediately.
  approvalStatus: "pending" | "approved" | "rejected";
}

export type AppointmentStatus =
  | "pending" // awaiting a call-back from the clinic to confirm (unpaid path)
  // Held for the patient, waiting for them to pay. This is what a follow-up
  // booked at the end of a visit starts as: the time is reserved and the
  // patient has been asked to confirm it, but nothing is booked until they do.
  //
  // Deliberately not folded into "pending". That means "the clinic will call
  // you" — the next move belongs to the clinic. Here the next move belongs to
  // the patient, and a list showing both under one label tells the wrong person
  // to act. `paymentDueAt` says when the hold lapses.
  | "awaiting-payment"
  | "confirmed" // booked — either paid online, or confirmed by the clinic after a call
  | "completed"
  | "cancelled";

export type AppointmentMode = "video" | "audio" | "chat" | "in-person";

// Whether this is the patient's first visit (full service + coupon flow) or
// a returning patient booking a follow-up (regular follow-up / session).
export type PatientType = "new" | "follow-up";

// Follow-up booking only: which kind of session the patient picked, each
// with its own duration and price (price lives on the matching Service doc
// — follow-up "services" are just regular Service docs tagged with the
// "Follow-up" category so admin manages pricing from the existing panel).
export type SessionType = "regular-followup" | "session-30" | "session-60";

// Whether the picked slot/doctor consultation happens in the clinic or
// over telemedicine — set from the slot the patient picked.
export type ConsultMode = "in-clinic" | "online";

// Session lifecycle for video/chat appointments — separate from AppointmentStatus
// because "confirmed" just means the booking is held; the session itself only
// becomes "live" at the scheduled time (or earlier/later if the admin starts
// it manually), and "ended" once either side closes it out.
export type SessionStatus = "not_started" | "live" | "ended";

// How the appointment was secured:
// "online-payment" -> paid instantly through the booking form, auto-confirmed
// "call-back"       -> patient asked the clinic to call and confirm instead
// "doctor-request" is booked without a slot: the patient wanted a service no
// available doctor covers, so the clinic assigns someone and schedules it.
// "follow-up" is booked by the doctor from an existing visit, then paid by the
// patient afterwards. It was previously recorded as "call-back", which read as
// "the clinic will phone this patient" on every screen that shows booking type
// — nobody ever phones them, and the thing actually waiting is the payment.
export type BookingType = "online-payment" | "call-back" | "doctor-request" | "follow-up";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId?: string; // assigned by admin — the appointment is invisible to any other doctor
  doctorName?: string;
  service: string;
  mode: AppointmentMode;
  date: string; // ISO date
  time: string;
  status: AppointmentStatus;
  amount: number;
  couponCode?: string;
  patientType?: PatientType; // "new" | "follow-up" — set from the booking flow's first step
  sessionType?: SessionType; // follow-up bookings only
  consultMode?: ConsultMode; // "in-clinic" | "online" — copied from the picked slot
  // Set whenever admin moves this appointment to a different slot. Kept as
  // a short history so patient/doctor can see it was rescheduled and why.
  rescheduledFrom?: { date: string; time: string; at: string; by: UserRole };
  reminderSentAt?: string; // set once the 24h-before reminder has gone out, so it never repeats
  /**
   * Set once the "starting in a few minutes" nudge has gone out. Deliberately a
   * separate flag from `reminderSentAt`: the two reminders fire at different
   * times and go to different people, so sharing one flag would silently
   * suppress whichever fired second.
   */
  startingSoonSentAt?: string;
  bookingType: BookingType;
  /**
   * When an "awaiting-payment" hold lapses, ISO. The slot stays reserved until
   * this passes; after it, the sweep in /api/notifications/reminders cancels
   * the appointment and frees the slot.
   *
   * Stored on the appointment rather than derived from createdAt so the clinic
   * can extend a particular hold without that meaning "change the rule for
   * everyone".
   */
  paymentDueAt?: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentProvider?: "card" | "paypal" | "jazzcash" | "easypaisa" | "cash";
  paymentReference?: string;
  /** When the money actually arrived, ISO. Set on pay-after-booking follow-ups. */
  paidAt?: string;
  roomUrl?: string; // Daily.co room, created when the video session starts
  chatThreadId?: string; // == appointment id; created when the chat session starts
  sessionStatus?: SessionStatus; // video/chat only — gates the join button
  sessionStartedAt?: string;
  sessionEndedAt?: string;
  notes?: string;
  slotId?: string; // the slots/{id} doc this booking reserved — freed automatically on cancel

  // Set on a "doctor-request" booking: no slot was held because no doctor
  // covering this service had availability. Admin assigns a doctor and
  // reschedules it into a real slot, which clears the flag.
  needsDoctor?: boolean;
  /** What the patient asked for, in their own words — admin schedules around it. */
  preferredWhen?: string;

  createdAt: string;
  // Patient's rating of the doctor after a completed session — set once,
  // via /api/appointments/[id]/rate.
  rating?: number; // 1-5
  ratingComment?: string;
  ratedAt?: string;
  // Doctor's e-prescription for this appointment, shown to the patient once saved.
  prescription?: string;
  prescribedAt?: string;
  /** Photos attached to the prescription — a written slip, a lab form, a scan. */
  prescriptionImages?: string[];

  // ---- Follow-up chain ----
  // Set on the ORIGINAL visit once the doctor books the next one from it, and
  // on the new appointment pointing back. Lets either side show "this was
  // scheduled at your last visit" without a second query.
  followUpAppointmentId?: string;
  followUpOf?: string;
  // Set when a confirmed appointment is cancelled — by whoever cancelled it.
  cancelledBy?: "patient" | "doctor" | "admin";
  cancelReason?: string;
  cancelledAt?: string;
  refundProcessedAt?: string; // set once the admin actually issues the refund via Stripe/PayPal
}

// Messages are end-to-end-ish encrypted per thread: the server hands out a
// thread-scoped AES-GCM key (derived from a server-only master secret) only
// to the appointment's own participants, and the browser encrypts/decrypts
// with the Web Crypto API. Firestore only ever stores ciphertext.
export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: UserRole;
  cipherText: string; // base64
  iv: string; // base64, 12 bytes for AES-GCM
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  maxUses: number;
  usedCount: number;
  restrictedEmails?: string[];
  expiresAt?: string;
  active: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string; // Cloudinary URL
  authorName: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Real-time in-app notifications for the bell icon in all three panels.
// Always created server-side (via src/lib/notifications.ts) so a client can
// never forge one — the client only ever reads its own and marks them read.
export type NotificationType =
  | "appointment-booked"
  | "appointment-confirmed"
  | "appointment-rescheduled"
  | "appointment-cancelled"
  | "appointment-reminder"
  | "appointment-starting-soon"
  // The doctor booked a follow-up and the patient needs to pay to hold it.
  | "appointment-awaiting-payment"
  // That hold ran out before they did.
  | "appointment-payment-expired"
  | "doctor-assigned";

export interface AppNotification {
  id: string;
  userId: string; // recipient — patientId, doctorId, or an admin's uid
  role: UserRole; // recipient's role, so the bell can be shown per-panel
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
  read: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  provider: "card" | "jazzcash" | "easypaisa" | "cash";
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  transactionId: string;
  createdAt: string;
}

// Services are fully managed from the admin panel (add / edit / delete) —
// this is the Firestore document shape for the "services" collection.
export interface Service {
  id: string;
  slug: string;
  category: string;
  name: string;
  short: string;
  intro: string;
  points: string[];
  treatments: string[];
  price?: number; // full price in PKR, shown on the booking form
  /**
   * What is taken online to hold the appointment, when that is less than the
   * full price. The clinic charges a PKR 5,000 advance on its longer
   * treatments and settles the balance at the visit.
   *
   * Undefined means the full price is charged at booking. Zero would mean
   * "nothing to pay online" — a different thing — so this stays optional
   * rather than defaulting to 0.
   */
  advancePayment?: number;
  /** Session length in minutes, as published. */
  durationMinutes?: number;
  image?: string; // Cloudinary URL, optional
  order: number;
  createdAt: string;
  updatedAt: string;
}
