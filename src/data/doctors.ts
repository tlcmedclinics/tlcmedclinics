import { site } from "@/data/site";

/**
 * The clinic's physicians, each with a page of their own.
 *
 * A patient choosing a psychiatrist wants to know who they will be sitting
 * with before they pay for the privilege, and a two-line summary on the home
 * page does not answer that. This is the long version: training, board
 * certifications, where the degrees came from.
 *
 * Written as data rather than as a page so a second doctor costs an entry here
 * and nothing else. There is one today.
 */

export type Doctor = {
  /** URL segment. Must stay stable — these get linked and indexed. */
  slug: string;
  name: string;
  /**
   * The name in Urdu script.
   *
   * Written by hand and never machine-translated. A person's name is not a
   * phrase to be rendered; getting it wrong in front of the patients who trust
   * him is a different kind of mistake from getting a sentence wrong.
   */
  nameUr: string;
  /**
   * Letters after the name, exactly as the clinic writes them.
   *
   * No Urdu twin on purpose — "M.B., B.S." means the same everywhere, and
   * transliterating it would make the qualification harder to verify, not
   * easier to read.
   */
  credentials: string;
  /** Role at the clinic. */
  title: string;
  titleUr: string;
  /** What they actually practise here, in patient words. */
  speciality: string;
  specialityUr: string;
  /** The qualifying degree, for the profile's detail table. */
  degree: string;
  degreeUr: string;
  /** One paragraph, for the profile's opening and the meta description. */
  summary: string;
  summaryUr: string;
  /** The bullet list, in the clinic's own order. */
  highlights: string[];
  highlightsUr: string[];
  /** Board certifications and fellowships, listed separately. */
  certifications: string[];
  certificationsUr: string[];
  /** Key into `images` — see src/data/images.ts. */
  imageKey: "doctor";
};

export const doctors: Doctor[] = [
  {
    slug: "dr-naseem-m-chaudhry",
    name: "Dr. Naseem M. Chaudhry",
    nameUr: "ڈاکٹر نسیم ایم چوہدری",
    credentials: "M.B., B.S., M.D., D.A.B.P.N.",
    title: "Medical Director",
    titleUr: "میڈیکل ڈائریکٹر",
    /**
     * Not "Vein Specialist".
     *
     * The clinic's previous site listed that, and Dr. Chaudhry is indeed
     * fellowship-trained in venous work — but TLC does not offer vein
     * treatment today. A speciality line advertising a service the booking
     * form cannot fulfil sends people here for something they will be turned
     * away from, which is a worse first impression than a shorter list. The
     * training still appears under certifications, where it is a fact about
     * him rather than an offer.
     */
    speciality: "Psychiatry & Neurology · Aesthetic Medicine",
    specialityUr: "نفسیات و اعصابی امراض · ایستھیٹک میڈیسن",
    degree: "M.D. — Doctor of Medicine",
    degreeUr: "M.D. — ڈاکٹر آف میڈیسن",
    summary:
      "Over 35 years in practice across General Medicine, Psychiatry & Neurology and Aesthetic Medicine, most of it in the United States. American Board Certified in Psychiatry and Neurology, and the physician who sits with you for a ketamine session rather than a technician following a protocol.",
    summaryUr:
      "جنرل میڈیسن، نفسیات و اعصابی امراض اور ایستھیٹک میڈیسن میں 35 سال سے زائد کا تجربہ، جس کا بیشتر حصہ امریکہ میں گزرا۔ امریکن بورڈ سے نفسیات و اعصابی امراض میں تصدیق شدہ — اور کیٹامین کے سیشن میں آپ کے ساتھ کوئی ٹیکنیشن نہیں بلکہ خود یہی معالج بیٹھتے ہیں۔",
    highlights: [
      "Graduated with honours from King Edward Medical College, Lahore.",
      "Awarded the “Best Doctor” award and nominated as a “Top Doctor” in Chicago, U.S.A.",
      "Over 35 years of experience practising across a variety of medical fields in the U.S.A.",
      "Extensively trained in General Medicine, Psychiatry & Neurology, Aesthetic Medicine and vein disease.",
      "Passionate about taking care of patients.",
      "He and his staff are always here to listen to patients’ needs and do what is necessary.",
    ],
    highlightsUr: [
      "کنگ ایڈورڈ میڈیکل کالج، لاہور سے اعزاز کے ساتھ فارغ التحصیل۔",
      "شکاگو، امریکہ میں ”بہترین ڈاکٹر“ کا اعزاز حاصل کیا اور ”ٹاپ ڈاکٹر“ کے لیے نامزد ہوئے۔",
      "امریکہ میں مختلف طبی شعبوں میں 35 سال سے زائد کا عملی تجربہ۔",
      "جنرل میڈیسن، نفسیات و اعصابی امراض، ایستھیٹک میڈیسن اور رگوں کے امراض میں وسیع تربیت۔",
      "مریضوں کی دیکھ بھال اُن کا جنون ہے۔",
      "وہ اور اُن کا عملہ ہمیشہ مریضوں کی بات سننے اور جو ضروری ہو وہ کرنے کے لیے موجود رہتے ہیں۔",
    ],
    certifications: [
      "American Board of Psychiatry and Neurology.",
      "American Academy of Aesthetic Medicine.",
      "Fellowships with the American Vein and Lymphatic Society in lasers, injections, micro-surgery and ultrasound-guided procedures.",
    ],
    certificationsUr: [
      "امریکن بورڈ آف سائیکائٹری اینڈ نیورولوجی۔",
      "امریکن اکیڈمی آف ایستھیٹک میڈیسن۔",
      "امریکن وین اینڈ لمفیٹک سوسائٹی کے ساتھ لیزر، انجیکشن، مائیکرو سرجری اور الٹراساؤنڈ کی مدد سے کیے جانے والے طریقوں میں فیلوشپس۔",
    ],
    imageKey: "doctor",
  },
];

/** The clinic's lead physician — the one the home page introduces. */
export const leadDoctor = doctors[0];

export function doctorBySlug(slug: string): Doctor | undefined {
  return doctors.find((d) => d.slug === slug);
}

/**
 * The contact details on a profile page.
 *
 * Read from site.ts rather than stored per doctor. Every physician here is
 * reached through the clinic's own number and address, and a copy of those on
 * each profile is a copy that goes stale the day the clinic moves.
 */
export const doctorContact = {
  phone: site.phone,
  phoneE164: site.phoneE164,
  email: site.email,
  address: site.address,
  addressUr: site.addressUr,
};
