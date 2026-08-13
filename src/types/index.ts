export type UserRole = "patient" | "doctor" | "admin";

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string; // Cloudinary URL
  createdAt: string;
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
  online?: boolean; // doctor-controlled presence toggle, shown to patients when picking a doctor
}

export type AppointmentStatus =
  | "pending" // awaiting a call-back from the clinic to confirm (unpaid path)
  | "confirmed" // booked — either paid online, or confirmed by the clinic after a call
  | "completed"
  | "cancelled";

export type AppointmentMode = "video" | "audio" | "chat" | "in-person";

// Session lifecycle for video/chat appointments — separate from AppointmentStatus
// because "confirmed" just means the booking is held; the session itself only
// becomes "live" at the scheduled time (or earlier/later if the admin starts
// it manually), and "ended" once either side closes it out.
export type SessionStatus = "not_started" | "live" | "ended";

// How the appointment was secured:
// "online-payment" -> paid instantly through the booking form, auto-confirmed
// "call-back"       -> patient asked the clinic to call and confirm instead
export type BookingType = "online-payment" | "call-back";

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
  bookingType: BookingType;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentProvider?: "card" | "paypal" | "jazzcash" | "easypaisa" | "cash";
  paymentReference?: string;
  roomUrl?: string; // Daily.co room, created when the video session starts
  chatThreadId?: string; // == appointment id; created when the chat session starts
  sessionStatus?: SessionStatus; // video/chat only — gates the join button
  sessionStartedAt?: string;
  sessionEndedAt?: string;
  notes?: string;
  createdAt: string;
  // Patient's rating of the doctor after a completed session — set once,
  // via /api/appointments/[id]/rate.
  rating?: number; // 1-5
  ratingComment?: string;
  ratedAt?: string;
  // Doctor's e-prescription for this appointment, shown to the patient once saved.
  prescription?: string;
  prescribedAt?: string;
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
  price?: number; // starting price in PKR, shown on the booking form
  image?: string; // Cloudinary URL, optional
  order: number;
  createdAt: string;
  updatedAt: string;
}
