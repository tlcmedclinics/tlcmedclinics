export const site = {
  name: "TLC Med Clinics",
  shortName: "TLC",
  tagline: "Whole-person care, US-trained standards, Lahore.",
  phone: "0310-040-4444",
  email: "info@tlcmedclinics.com",
  address: "221-G1 Johar Town, Near Doctors Hospital, Lahore, Pakistan",
  hours: [
    { label: "Mon – Sat", value: "11:00 AM – 2:00 PM & 4:00 PM – 8:00 PM" },
    { label: "Telemedicine", value: "Mon – Sat, 11:00 AM – 9:30 PM" },
  ],
  stats: [
    { value: "35+", label: "Years of clinical experience" },
    { value: "10,200+", label: "Patients treated" },
    { value: "98%", label: "Patient satisfaction" },
    { value: "3", label: "Specialty programs under one roof" },
  ],
  doctor: {
    name: "Dr. A. Chaudhry",
    title: "Medical Director",
    credentials: "M.B.B.S, M.D., D.A.B.P.N.",
    bio: "Over 35 years of clinical experience across General Medicine, Psychiatry & Neurology, Aesthetic Medicine, and Vein Care. U.S. Board Certified.",
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
      "We bring vein care, skin care, and mental health together under one clinical team, led by " +
      site.doctor.name +
      ", so you aren't shuffled between disconnected specialists.",
  },
  {
    question: "Where is the clinic located?",
    answer: site.address,
  },
];

// `labelKey` resolves through the i18n dictionary rather than being a literal,
// so the public header translates with the rest of the site.
export const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/services", labelKey: "nav.services" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/contact", labelKey: "nav.contact" },
];
