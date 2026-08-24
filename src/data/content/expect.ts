import type { ContentPage } from "./types";

/**
 * What to expect — the practical pages.
 *
 * Vein-specific preparation (compression stockings, ultrasound hydration,
 * wearing shorts for a leg examination) has been removed along with the
 * service itself. What remains is what a mental health or skin patient
 * actually needs to know before walking in.
 */

export const expectPages: ContentPage[] = [
  {
    slug: "first-time-consultation",
    title: "First-Time Consultation",
    summary:
      "What to bring, what to expect, and how your first appointment is structured.",
    group: "what-to-expect",
    blocks: [
      { kind: "h", text: "Walk in prepared, walk out informed" },
      {
        kind: "p",
        text: "We want you to feel comfortable and confident on your first visit, with a clear understanding of what to expect. Please arrive 15 minutes before your appointment time to complete check-in and your new patient forms. You can print the patient history form from this site, fill it in at home and bring it with you — it saves time on the day.",
      },
      { kind: "h", text: "Bring on the day of your first visit" },
      {
        kind: "ul",
        items: [
          "A list of your current medications",
          "Information about treatments and medications you have tried in the past",
          "Medical records from prior visits that you think may be helpful",
        ],
      },
      { kind: "h", text: "Your appointment" },
      {
        kind: "p",
        text: "For a mental health appointment you will meet an American Board Certified psychiatrist with over 30 years of experience, ranked a 'top doctor' in the United States in his field by his peers. He regularly provides telemedicine consultations to patients around the world as well as in-person consultations in Lahore.",
      },
      {
        kind: "p",
        text: "The first appointment is longer than a follow-up, on purpose — so your history and background can be gone through thoroughly. You will get an in-depth analysis and understanding of the core issues before any medication is started.",
      },
      { kind: "h", text: "Costs" },
      {
        kind: "p",
        text: "You will also speak to an office manager about the cost of treatment as it applies to your diagnosis and plan, and about when treatment will begin. A psychiatric consultation is PKR 3,000.",
      },
    ],
  },
  {
    slug: "telemedicine-consult",
    title: "Telemedicine Consult",
    summary: "Getting answers from home — how an online consultation runs.",
    group: "what-to-expect",
    blocks: [
      {
        kind: "p",
        text: "Telemedicine is healthcare conducted remotely, by phone or over the internet. It lets you have a virtual appointment with our doctors without travelling to the clinic.",
      },
      { kind: "h", text: "The process is as simple as 1, 2, 3" },
      {
        kind: "ol",
        items: [
          "Book online from this website, or call the clinic.",
          "Pay your fee online through our secure checkout.",
          "Open your dashboard at the appointment time and join the call.",
        ],
      },
      { kind: "h", text: "What you need" },
      {
        kind: "ul",
        items: [
          "A reasonable internet connection",
          "A phone, tablet or computer with a camera",
          "A microphone — most devices have one built in",
        ],
      },
      {
        kind: "note",
        text: "We do not store credit card, debit card or bank details on our servers. Payments are handled by the payment provider.",
      },
    ],
  },
  {
    slug: "comprehensive-care",
    title: "Comprehensive Care",
    summary:
      "Short- and long-term care, and why every treatment plan here is different.",
    group: "what-to-expect",
    blocks: [
      { kind: "h", text: "Every patient is different" },
      {
        kind: "p",
        text: "Whether your goals are cosmetic, health-related or about general wellness, the aim is to get you back to your usual life as soon as possible — and our treatment plans are built around that rather than around a standard package.",
      },
      {
        kind: "p",
        text: "This is why we don't publish an average number of sessions for a course of treatment. The honest answer only exists after an examination, and a number quoted before that is a guess dressed up as information.",
      },
      { kind: "h", text: "Follow-up matters as much as treatment" },
      {
        kind: "p",
        text: "Our follow-up programme is designed to identify and address issues early, which is what produces good long-term results. For mental health in particular, the regular review is not an add-on to treatment — it is the treatment.",
      },
      { kind: "h", text: "Other services" },
      {
        kind: "p",
        text: "We also offer complete medical and diagnostic services alongside mental health and skin care. If you are unsure which is relevant to you, book an initial evaluation and we will point you in the right direction.",
      },
    ],
  },
  {
    slug: "costs",
    title: "Costs",
    summary: "Consultation and treatment fees, stated plainly.",
    group: "what-to-expect",
    blocks: [
      {
        kind: "p",
        text: "For a mental health appointment you will meet an American Board Certified psychiatrist with over 35 years of experience, ranked a 'top doctor' in the United States in his field by his peers.",
      },
      {
        kind: "table",
        caption: "Consultation fees",
        rows: [
          ["Initial evaluation with a specialist", "PKR 3,000"],
          ["Follow-up — 15 min medication management", "PKR 3,500"],
          ["Follow-up — 30 min therapy + medication management", "PKR 6,000"],
          ["Follow-up — 60 min therapy + medication management", "PKR 12,000"],
        ],
      },
      {
        kind: "table",
        caption: "Treatments",
        rows: [
          ["Ketamine therapy, 180 min", "PKR 18,000"],
          ["Full face micro-needling with PRP, 90 min", "PKR 16,000"],
          ["Hair regrowth with PRP, 90 min", "PKR 20,000"],
          ["Botox, up to 50 units", "PKR 12,000"],
          ["Botox, up to 100 units", "PKR 22,000"],
          ["PRF under eyes, 60 min", "PKR 12,000"],
          ["PRF nasolabial folds, 60 min", "PKR 10,000"],
          ["PRF lips, 60 min", "PKR 12,000"],
          ["Lip flip — Botox only, 30 min", "PKR 8,000"],
          ["Lip flip — Botox with filler, 60 min", "PKR 20,000"],
          ["Lipolytic injection for double chin, 60 min", "PKR 12,000"],
        ],
      },
      {
        kind: "note",
        text: "Treatments marked with an advance payment on the booking form require PKR 5,000 to hold the appointment; the balance is settled at the visit.",
      },
    ],
  },
  {
    slug: "patient-forms",
    title: "Patient Forms & Guidance",
    summary: "The forms to bring, and where to find answers before you visit.",
    group: "what-to-expect",
    blocks: [
      { kind: "h", text: "Patient history" },
      {
        kind: "p",
        text: "We ask about your symptoms and lifestyle so we can understand your condition, concerns and goals properly. We also ask about your general health, medications and allergies. Completing the patient history form at home and bringing it with you saves time at your first appointment.",
      },
      { kind: "h", text: "Authorisation for communication" },
      {
        kind: "p",
        text: "We ask for basic information about the best way to contact you and your family over the course of your treatment.",
      },
      {
        kind: "note",
        text: "Both forms are available from the clinic — call us and we will send them to you before your visit. See the FAQ page for answers to the questions patients most often ask before a first appointment.",
      },
    ],
  },
];
