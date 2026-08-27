/** The days the clinic is open, spelled the way schema.org expects. */
const CLINIC_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const site = {
  name: "TLC Med Clinics",
  shortName: "TLC",
  tagline: "Whole-person care, US-trained standards, Lahore.",
  /**
   * The default meta description. It lives here rather than in layout.tsx so
   * the same sentence feeds OpenGraph, structured data and the sitemap without
   * three copies drifting apart.
   */
  description:
    "TLC Med Clinics, Lahore — mental health, ketamine therapy and skin care under one roof, led by U.S. board-certified physicians. In-clinic visits and telemedicine appointments.",
  phone: "+92 310 040 4444",
  /**
   * The same number in E.164. Structured data and Google Business Profile both
   * want the international form; `phone` above is what patients read.
   */
  phoneE164: "+923100404444",
  email: "info@tlcmedclinics.com",
  address: "221-G1 Johar Town, Near Doctors Hospital, Lahore, Pakistan",
  /**
   * The address split into fields, for schema.org PostalAddress. Google matches
   * a clinic to its Business Profile partly on this, so it has to read exactly
   * the same way in both places.
   */
  addressParts: {
    street: "221-G1 Johar Town, Near Doctors Hospital",
    city: "Lahore",
    region: "Punjab",
    country: "PK",
  },
  hours: [
    { label: "Mon – Sat", value: "11:00 AM – 2:00 PM & 4:00 PM – 8:00 PM" },
    { label: "Telemedicine", value: "Mon – Sat, 11:00 AM – 9:30 PM" },
  ],
  /**
   * The same opening hours in 24-hour form, for structured data. `hours` above
   * is written for people; this one is written for crawlers. They sit next to
   * each other so changing one is an obvious prompt to change the other.
   */
  openingHours: [
    { days: CLINIC_DAYS, opens: "11:00", closes: "14:00" },
    { days: CLINIC_DAYS, opens: "16:00", closes: "20:00" },
  ],
  /**
   * Where the online day starts and ends by default — the 24-hour form of the
   * "Telemedicine" line in `hours` above.
   *
   * Only a starting point. A doctor opening online times can move both ends,
   * because telemedicine is not tied to the building: a consultant seeing
   * patients at 9pm from home is the ordinary case, not the exception. The
   * in-clinic grid gets no such freedom — `openingHours` is when the doors are
   * actually unlocked.
   */
  telemedicineWindow: { opens: "11:00", closes: "21:30" },
  /**
   * Public profiles that belong to this clinic — Facebook, Instagram, the
   * Google Business Profile link, a Marham/Oladoc listing. Google uses these
   * (schema.org `sameAs`) to confirm the website and the listings are the same
   * business, which is one of the strongest local ranking signals there is.
   * Empty until real URLs exist — a wrong link is worse than none.
   */
  socials: [] as string[],
  /**
   * Exact map coordinates, optional. Left undefined until they're copied from
   * the clinic's own Google Business Profile, because a guessed pin is worse
   * than no pin.
   */
  geo: undefined as { latitude: number; longitude: number } | undefined,
  /**
   * The headline figures, animated on the home page by StatsBand.
   *
   * Each is parsed for its digits there, so keep them in this shape: an
   * optional prefix, the number, an optional suffix ("38", "259,200+", "100%").
   */
  stats: [
    { value: "38", label: "Years of experience" },
    { value: "259,200+", label: "Patients treated" },
    { value: "100%", label: "Quality of care" },
    { value: "3", label: "Specialty programmes under one roof" },
  ],
  doctor: {
    name: "Dr. Naseem M. Chaudhry",
    title: "Medical Director",
    credentials: "M.B.B.S, M.D., D.A.B.P.N.",
    bio: "Over 35 years of clinical experience across General Medicine, Psychiatry & Neurology, and Aesthetic Medicine. American Board Certified in Psychiatry and Neurology; Castle Connolly “Top Doctor”, Chicago.",
  },
};

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Munir A.",
    role: "Businessman",
    quote:
      "Pehli visit thi, achha response diya doctor sahab ne aur time bhi poora diya patient ko. Baqi Allah Pak meri walda ko sehat ata farmaye.",
  },
  {
    name: "Agha Jamal",
    role: "Businessman",
    quote:
      "Dr. Naseem is good — I have seen patients and attendants returning from him very satisfied. He listens carefully, gives enough time to assess and examine, and provides outstanding care.",
  },
  {
    name: "Muhammad Kamran",
    role: "Businessman",
    quote:
      "I would highly recommend this doctor to anyone who wants to see a psychiatrist. He is very kind and sympathetic towards his patients and understands their problems in great detail.",
  },
  {
    name: "Malik Irfan",
    role: "Businessman",
    quote:
      "MashAllah, very caring, humble and cooperative health professional. A very nice person and a psychiatrist — humble, sympathetic and extremely competent. Great experience!",
  },
  {
    name: "S. Chaudhry",
    role: "Patient's Parent",
    quote:
      "Dr. Naseem Chaudhry is a very competent psychiatrist. My 14-year-old son is under his treatment, and with the blessings of Allah Almighty he is recovering. Dr. Naseem sahab is a very humble person.",
  },
  {
    name: "Somia N.",
    role: "Businesswoman",
    quote:
      "I met Dr. Naseem at a difficult time in my life. I never thought I would resort to medication or therapy, and did not believe in them either. With his warm, understanding and compassionate personality, treatment has been a beautiful journey. He helped me let go of fears I had lived with for years.",
  },
  {
    name: "Fatima A.",
    role: "Patient",
    quote:
      "Dr. Naseem did an amazing job with my skin. He performed three micro-needling and PRP treatments for my face — gentle, and almost perfect in technique. Highly recommended.",
  },
  {
    name: "Imran Z.",
    role: "Patient",
    quote:
      "The way you have treated me, I am thoroughly impressed. You very professionally dealt with varied opinions of other consultants and specialists, and provided such clinically honest care and treatment.",
  },
  {
    name: "Jamal",
    role: "Patient",
    quote:
      "I visited Dr. Naseem Chaudhry three weeks back. He listened to all my problems very carefully. The medication he prescribed for depression is working very well.",
  },
  {
    name: "Owais",
    role: "Businessman",
    quote:
      "It was a great experience with Dr. Naseem. Such a humble and great personality. 100% recommended.",
  },
];

export type ClinicValue = {
  title: string;
  body: string;
};

export const clinicValues: ClinicValue[] = [
  {
    title: "Patient as part of the team",
    body: "We use a team approach to care and involve the patient as part of that team, every step of the way.",
  },
  {
    title: "Open access to the community",
    body: "We're committed to serving the community and providing open access to the clinic for all community members.",
  },
  {
    title: "Confidence that spreads",
    body: "By instilling confidence in our patients, they become positive forces in the community and contribute to the health of others.",
  },
  {
    title: "Pursuit of excellence",
    body: "In all we do, we actively pursue excellence and search for the next level of accomplishment. We take pride in our work.",
  },
  {
    title: "Integrity, always",
    body: "Our integrity and ethics will never be compromised. Caring for people is our primary focus.",
  },
  {
    title: "Respect for one another",
    body: "We're as respectful, friendly, helpful, and supportive to one another as we are to our patients.",
  },
  {
    title: "Teamwork",
    body: "Teamwork is central to our work — we each take responsibility to contribute effectively to the team.",
  },
  {
    title: "Strong work ethic, real personality",
    body: "We have a strong work ethic, yet we don't stifle our individual personalities. Fun and humor are healthy for us and for our patients.",
  },
];

export type Faq = {
  question: string;
  answer: string;
};

export const faqs: Faq[] = [
  {
    question: "How do I book an appointment?",
    answer:
      "Use the Book Appointment button on any page, or call us at " +
      site.phone +
      ". In-clinic and telemedicine slots are both available.",
  },
  {
    question: "Do you offer telemedicine consults?",
    answer:
      "Yes — telemedicine consults run " +
      site.hours[1].value +
      ", " +
      site.hours[0].label +
      ", so you can be seen without visiting in person.",
  },
  {
    question: "What does TLC Med Clinics treat?",
    answer:
      "We bring mental health, ketamine therapy and skin care together under one clinical team, led by " +
      site.doctor.name +
      ", so you aren't shuffled between disconnected specialists.",
  },
  {
    question: "Where is the clinic located?",
    answer: site.address,
  },
  {
    question: "What should I expect at my first visit?",
    answer:
      "Arrive 15 minutes early to complete check-in. Bring a list of your current medications, notes on treatments you have tried before, and any medical records you think will help. A first appointment is deliberately longer than a follow-up, so your history can be gone through properly before any medication is started.",
  },
  {
    question: "What are your hours?",
    answer:
      site.hours[0].label + ", " + site.hours[0].value + ". Telemedicine consults run " + site.hours[1].value + ".",
  },
  {
    question: "Why choose TLC Med Clinics?",
    answer:
      "Care is led by a U.S. board certified physician with over 35 years of experience, using U.S. diagnosis and treatment protocols — in a clinic in Lahore, at local cost. We are also the first clinic of our kind in the city to offer ketamine therapy under physician supervision.",
  },
  {
    question: "Do I need a referral?",
    answer:
      "No. You can book an initial evaluation directly, in the clinic or by telemedicine, and the doctor will tell you what care you need from there.",
  },
  {
    question: "Is my consultation confidential?",
    answer:
      "Yes. Telemedicine sessions are encrypted per session, and your records are visible only to you and your treating clinician. Nothing is shared without your consent.",
  },
  {
    question: "Can I bring my child to the appointment?",
    answer:
      "Yes — and if the appointment is for your child, please come with them. We treat adolescent problems, ADHD and children's developmental concerns, and a parent's account of what has been happening is part of the assessment.",
  },
  {
    question: "How do I pay?",
    answer:
      "Online, through the secure checkout when you book. Card details are handled by the payment provider and are never stored on our servers. Some treatments take a PKR 5,000 advance to hold the appointment, with the balance settled at the visit.",
  },
];

// `labelKey` resolves through the i18n dictionary rather than being a literal,
// so the public header translates with the rest of the site.
export const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/conditions", labelKey: "nav.conditions" },
  { href: "/treatments", labelKey: "nav.treatments" },
  { href: "/telemedicine", labelKey: "nav.telemedicine" },
  { href: "/what-to-expect", labelKey: "nav.whatToExpect" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/contact", labelKey: "nav.contact" },
];

/**
 * The footer's link columns.
 *
 * Separate from navLinks because a footer is a site map, not a menu: it can
 * afford the depth the header can't, and it is where people look for the
 * pages that don't earn a place in the top bar — fees, forms, policies.
 */
export const footerColumns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Telemedicine",
    links: [
      { href: "/telemedicine/what-is-telemedicine", label: "What is Telemedicine?" },
      { href: "/telemedicine/benefits", label: "Benefits" },
      { href: "/telemedicine/how-it-works", label: "How does it work?" },
      { href: "/patient/book", label: "Schedule & pay online" },
      { href: "/privacy", label: "Privacy practices" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
  {
    heading: "Conditions",
    links: [
      { href: "/conditions/mental-disorders", label: "Mental disorders" },
      { href: "/conditions/major-depressive-disorder", label: "Depression" },
      { href: "/conditions/generalized-anxiety-disorder", label: "Anxiety" },
      { href: "/conditions/acne-scars", label: "Acne scars" },
      { href: "/conditions/hair-thinning-hair-loss", label: "Hair thinning & hair loss" },
      { href: "/conditions", label: "View all" },
    ],
  },
  {
    heading: "Treatments",
    links: [
      { href: "/treatments/ketamine-therapy", label: "Ketamine therapy" },
      { href: "/treatments/psychiatric-consultation", label: "Psychiatric consultation" },
      { href: "/treatments/botox", label: "Botox" },
      { href: "/treatments/micro-needling-with-prp", label: "Micro-needling with PRP" },
      { href: "/treatments/hair-regrowth-with-prp", label: "Hair regrowth with PRP" },
      { href: "/treatments", label: "View all" },
    ],
  },
  {
    heading: "Clinic",
    links: [
      { href: "/what-to-expect/first-time-consultation", label: "First-time consultation" },
      { href: "/what-to-expect/costs", label: "Costs" },
      { href: "/what-to-expect/patient-forms", label: "Patient forms" },
      { href: "/about/our-doctors", label: "Our doctors" },
      { href: "/faq", label: "FAQ & answers" },
      { href: "/contact", label: "Contact" },
    ],
  },
];
