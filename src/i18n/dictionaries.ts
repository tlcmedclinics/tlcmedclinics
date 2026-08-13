export type Locale = "en" | "ur";

// Flat dot-key dictionaries — small and dependency-free by design (no
// next-intl needed). Add new keys here as the UI grows; useT() falls back
// to the key itself if a translation is missing, so nothing ever crashes.
export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    "common.close": "Close",
    "common.send": "Send",
    "common.loading": "Loading…",
    "common.logout": "Log out",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.language": "Language",

    "nav.overview": "Overview",
    "nav.appointments": "Appointments",
    "nav.patients": "Patients",
    "nav.doctors": "Doctors",
    "nav.services": "Services",
    "nav.coupons": "Coupons",
    "nav.blogs": "Blogs",
    "nav.dashboard": "Dashboard",
    "nav.book": "Book a session",

    "role.admin": "Admin",
    "role.doctor": "Doctor",
    "role.patient": "Patient",

    "chat.encrypted": "Encrypted",
    "chat.hostView": "Host view",
    "chat.chatWith": "Chat with",
    "chat.consultation": "Chat consultation",
    "chat.unlocking": "Unlocking secure conversation…",
    "chat.empty": "No messages yet — say hello to start the consultation.",
    "chat.placeholder": "Type a message…",
    "chat.loadError": "Couldn't load chat messages. Check your connection and try again.",
    "chat.sendError": "Message couldn't be sent. Please try again.",

    "video.title": "Video consultation",
    "video.hostTitle": "Video session with",
    "video.leave": "Leave",

    "doctor.dashboard.title": "Welcome back, Doctor",
    "doctor.dashboard.subtitle": "Here's what's on your schedule.",
    "doctor.appointments.title": "My appointments",
    "doctor.appointments.subtitle":
      "Only patients assigned to you appear here. Start a video or chat session once it's confirmed and it's time.",
    "doctor.patients.title": "My patients",

    "security.badge": "Secured with per-session encryption",
  },
  ur: {
    "common.close": "بند کریں",
    "common.send": "بھیجیں",
    "common.loading": "لوڈ ہو رہا ہے…",
    "common.logout": "لاگ آؤٹ",
    "common.save": "محفوظ کریں",
    "common.cancel": "منسوخ کریں",
    "common.language": "زبان",

    "nav.overview": "جائزہ",
    "nav.appointments": "اپائنٹمنٹس",
    "nav.patients": "مریض",
    "nav.doctors": "ڈاکٹرز",
    "nav.services": "خدمات",
    "nav.coupons": "کوپن",
    "nav.blogs": "بلاگز",
    "nav.dashboard": "ڈیش بورڈ",
    "nav.book": "سیشن بک کریں",

    "role.admin": "ایڈمن",
    "role.doctor": "ڈاکٹر",
    "role.patient": "مریض",

    "chat.encrypted": "خفیہ کردہ",
    "chat.hostView": "ہوسٹ ویو",
    "chat.chatWith": "چیٹ کریں",
    "chat.consultation": "چیٹ مشاورت",
    "chat.unlocking": "محفوظ گفتگو کھولی جا رہی ہے…",
    "chat.empty": "ابھی کوئی پیغام نہیں — مشاورت شروع کرنے کے لیے سلام کہیں۔",
    "chat.placeholder": "پیغام لکھیں…",
    "chat.loadError": "پیغامات لوڈ نہیں ہو سکے۔ اپنا کنکشن چیک کر کے دوبارہ کوشش کریں۔",
    "chat.sendError": "پیغام نہیں بھیجا جا سکا۔ دوبارہ کوشش کریں۔",

    "video.title": "ویڈیو مشاورت",
    "video.hostTitle": "ویڈیو سیشن بمعہ",
    "video.leave": "چھوڑیں",

    "doctor.dashboard.title": "خوش آمدید، ڈاکٹر",
    "doctor.dashboard.subtitle": "آپ کا آج کا شیڈول یہ ہے۔",
    "doctor.appointments.title": "میری اپائنٹمنٹس",
    "doctor.appointments.subtitle":
      "صرف آپ کو تفویض کردہ مریض یہاں نظر آتے ہیں۔ تصدیق اور وقت ہونے پر ویڈیو یا چیٹ سیشن شروع کریں۔",
    "doctor.patients.title": "میرے مریض",

    "security.badge": "ہر سیشن کی انکرپشن سے محفوظ",
  },
};
