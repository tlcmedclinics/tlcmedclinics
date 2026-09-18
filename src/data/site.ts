/** The days the clinic is open, spelled the way schema.org expects. */
const CLINIC_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * ── Why every piece of copy here has an `Ur` twin ──
 *
 * The interface translated and the *content* did not. Switching the site to
 * Urdu gave a patient Urdu navigation wrapped around English opening hours,
 * English patient reviews and an English FAQ — the words they actually came to
 * read stayed in the language they were trying to avoid.
 *
 * So the second language lives beside the first, field by field, using the same
 * `x` / `xUr` convention the services catalogue already uses in Firestore.
 * `lib/bilingual.ts` is the one place that decides which of the two to show,
 * and it falls back to English silently when an Urdu string is missing.
 *
 * Two deliberate exceptions:
 * - `description` stays English. It is the meta description, rendered on the
 *   server into static HTML before anyone has chosen a language, and it is what
 *   Google indexes.
 * - Names of people and places, and `credentials`, are not translated.
 *   Transliterating somebody's name or "M.B.B.S" into Urdu script helps nobody
 *   and makes the clinic harder to find.
 */
export const site = {
  name: "TLC Med Clinics",
  shortName: "TLC",
  tagline: "Whole-person care, US-trained standards, Lahore.",
  taglineUr: "پورے انسان کا علاج، امریکی تربیت یافتہ معیار، لاہور۔",
  /**
   * The default meta description. It lives here rather than in layout.tsx so
   * the same sentence feeds OpenGraph, structured data and the sitemap without
   * three copies drifting apart.
   *
   * English only, on purpose — see the note at the top of this file.
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
  /**
   * The mobile apps, once they are published.
   *
   * Empty means "not out yet", and the band above the footer reads that: each
   * platform shows "coming soon" rather than a button, and when both are empty
   * the whole band does not render. A store link that 404s is worse than no
   * link — a patient taps it, sees a missing page, and decides the app is
   * broken before ever opening it.
   *
   * Paste the Play Store / App Store URL here on the day each goes live;
   * nothing else has to change.
   */
  apps: {
    android: "",
    ios: "",
    /**
     * Show the band before either app is published.
     *
     * With both links empty and this true, the section still appears and each
     * platform reads "coming soon" — which is a real thing to tell people, and
     * the reason app-store badges exist on sites weeks before the app does.
     *
     * Set it to false to take the whole section off the site until there is
     * something to link to.
     */
    announce: true,
  },
  address: "221-G1 Johar Town, Near Doctors Hospital, Lahore, Pakistan",
  addressUr: "221-G1 جوہر ٹاؤن، ڈاکٹرز ہسپتال کے قریب، لاہور، پاکستان",
  /**
   * The address split into fields, for schema.org PostalAddress. Google matches
   * a clinic to its Business Profile partly on this, so it has to read exactly
   * the same way in both places — which is why there is no Urdu version of it.
   */
  addressParts: {
    street: "221-G1 Johar Town, Near Doctors Hospital",
    city: "Lahore",
    region: "Punjab",
    country: "PK",
  },
  hours: [
    {
      label: "Mon – Sat",
      labelUr: "پیر – ہفتہ",
      value: "11:00 AM – 2:00 PM & 4:00 PM – 8:00 PM",
      valueUr: "صبح 11:00 – دوپہر 2:00 اور شام 4:00 – رات 8:00",
    },
    {
      label: "Telemedicine",
      labelUr: "ٹیلی میڈیسن",
      value: "Mon – Sat, 11:00 AM – 9:30 PM",
      valueUr: "پیر – ہفتہ، صبح 11:00 – رات 9:30",
    },
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
   * Public profiles that belong to this clinic.
   *
   * One list, two jobs, and that is deliberate. The footer renders these as
   * icons, and lib/seo.ts feeds the same URLs to schema.org `sameAs` — which
   * is how Google confirms that this website and those profiles are the same
   * business, one of the strongest local ranking signals there is. Keeping
   * them in two lists would mean adding a profile in one place and wondering
   * six months later why the other never knew about it.
   *
   * `icon` names an icon in components/Icons.tsx. Add a network here and the
   * footer picks it up; there is nothing else to edit.
   *
   * Only real, verified URLs. A wrong link in `sameAs` tells Google this site
   * belongs to somebody else, which is worse than telling it nothing.
   *
   * The labels are brand names and stay as they are in every language.
   */
  socials: [
    {
      label: "Facebook",
      href: "https://www.facebook.com/share/19Hce2nCE9/",
      icon: "facebook" as const,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/tlcmedclinics/",
      icon: "instagram" as const,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/tlc-med-clinics/",
      icon: "linkedin" as const,
    },
  ],
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
   *
   * `value` has no Urdu twin deliberately: the figures stay in Latin digits, the
   * same as the prices, the phone number and the website. A patient comparing
   * what the site says with what the app says should not have to read two
   * different number systems.
   */
  stats: [
    { value: "38", label: "Years of experience", labelUr: "سال کا تجربہ" },
    { value: "259,200+", label: "Patients treated", labelUr: "مریضوں کا علاج" },
    { value: "100%", label: "Quality of care", labelUr: "علاج کا معیار" },
    {
      value: "3",
      label: "Specialty programmes under one roof",
      labelUr: "ایک چھت تلے تین خصوصی شعبے",
    },
  ],
  doctor: {
    name: "Dr. Naseem M. Chaudhry",
    nameUr: "ڈاکٹر نسیم ایم چوہدری",
    title: "Medical Director",
    titleUr: "میڈیکل ڈائریکٹر",
    // Qualifications are not translated — they are the same letters everywhere,
    // and an Urdu rendering of "M.B.B.S" would make them harder to verify.
    credentials: "M.B.B.S, M.D., D.A.B.P.N.",
    bio: "Over 35 years of clinical experience across General Medicine, Psychiatry & Neurology, and Aesthetic Medicine. American Board Certified in Psychiatry and Neurology; Castle Connolly “Top Doctor”, Chicago.",
    bioUr:
      "جنرل میڈیسن، نفسیات و اعصابی امراض اور ایستھیٹک میڈیسن میں 35 سال سے زائد کا طبی تجربہ۔ امریکن بورڈ سے نفسیات و اعصابی امراض میں تصدیق شدہ؛ کیسل کونلی کی جانب سے شکاگو کے ”ٹاپ ڈاکٹر“۔",
  },
};

export type Testimonial = {
  name: string;
  role: string;
  roleUr: string;
  quote: string;
  quoteUr: string;
};

/**
 * Patient reviews.
 *
 * The names are left exactly as the patients gave them, in both languages.
 * Munir A.'s review was written in Roman Urdu to begin with — `quoteUr` is that
 * same sentence in Urdu script, not a re-translation, because the words are
 * already his.
 */
export const testimonials: Testimonial[] = [
  {
    name: "Munir A.",
    role: "Businessman",
    roleUr: "کاروباری شخصیت",
    quote:
      "Pehli visit thi, achha response diya doctor sahab ne aur time bhi poora diya patient ko. Baqi Allah Pak meri walda ko sehat ata farmaye.",
    quoteUr:
      "پہلی وزٹ تھی، ڈاکٹر صاحب نے اچھا رسپانس دیا اور مریض کو پورا وقت بھی دیا۔ باقی اللہ پاک میری والدہ کو صحت عطا فرمائے۔",
  },
  {
    name: "Agha Jamal",
    role: "Businessman",
    roleUr: "کاروباری شخصیت",
    quote:
      "Dr. Naseem is good — I have seen patients and attendants returning from him very satisfied. He listens carefully, gives enough time to assess and examine, and provides outstanding care.",
    quoteUr:
      "ڈاکٹر نسیم بہت اچھے ہیں — میں نے مریضوں اور اُن کے ساتھ آنے والوں کو اُن سے بہت مطمئن ہو کر لوٹتے دیکھا ہے۔ وہ غور سے سنتے ہیں، جانچ اور معائنے کے لیے پورا وقت دیتے ہیں، اور نہایت عمدہ علاج کرتے ہیں۔",
  },
  {
    name: "Muhammad Kamran",
    role: "Businessman",
    roleUr: "کاروباری شخصیت",
    quote:
      "I would highly recommend this doctor to anyone who wants to see a psychiatrist. He is very kind and sympathetic towards his patients and understands their problems in great detail.",
    quoteUr:
      "جو بھی کسی ماہرِ نفسیات سے رجوع کرنا چاہے، میں اُسے اِن ڈاکٹر صاحب کا مشورہ ضرور دوں گا۔ وہ اپنے مریضوں کے ساتھ بہت شفقت اور ہمدردی سے پیش آتے ہیں اور اُن کے مسائل کو بڑی تفصیل سے سمجھتے ہیں۔",
  },
  {
    name: "Malik Irfan",
    role: "Businessman",
    roleUr: "کاروباری شخصیت",
    quote:
      "MashAllah, very caring, humble and cooperative health professional. A very nice person and a psychiatrist — humble, sympathetic and extremely competent. Great experience!",
    quoteUr:
      "ماشاءاللہ، بہت خیال رکھنے والے، منکسر المزاج اور تعاون کرنے والے معالج۔ ایک نہایت اچھے انسان اور ماہرِ نفسیات — عاجز، ہمدرد اور انتہائی قابل۔ بہترین تجربہ رہا!",
  },
  {
    name: "S. Chaudhry",
    role: "Patient's Parent",
    roleUr: "مریض کے والد",
    quote:
      "Dr. Naseem Chaudhry is a very competent psychiatrist. My 14-year-old son is under his treatment, and with the blessings of Allah Almighty he is recovering. Dr. Naseem sahab is a very humble person.",
    quoteUr:
      "ڈاکٹر نسیم چوہدری ایک نہایت قابل ماہرِ نفسیات ہیں۔ میرا 14 سالہ بیٹا اُن کے زیرِ علاج ہے اور اللہ تعالیٰ کے فضل سے صحت یاب ہو رہا ہے۔ ڈاکٹر نسیم صاحب بہت منکسر المزاج انسان ہیں۔",
  },
  {
    name: "Somia N.",
    role: "Businesswoman",
    roleUr: "کاروباری خاتون",
    quote:
      "I met Dr. Naseem at a difficult time in my life. I never thought I would resort to medication or therapy, and did not believe in them either. With his warm, understanding and compassionate personality, treatment has been a beautiful journey. He helped me let go of fears I had lived with for years.",
    quoteUr:
      "میں ڈاکٹر نسیم سے اپنی زندگی کے ایک مشکل وقت میں ملی۔ میں نے کبھی نہیں سوچا تھا کہ میں دوا یا تھراپی کا سہارا لوں گی، نہ ہی مجھے اِن پر یقین تھا۔ اُن کی گرمجوش، سمجھنے والی اور ہمدرد شخصیت کے ساتھ یہ علاج ایک خوبصورت سفر بن گیا۔ اُنہوں نے مجھے اُن خوفوں سے نجات دلائی جن کے ساتھ میں برسوں جیتی رہی تھی۔",
  },
  {
    name: "Fatima A.",
    role: "Patient",
    roleUr: "مریضہ",
    quote:
      "Dr. Naseem did an amazing job with my skin. He performed three micro-needling and PRP treatments for my face — gentle, and almost perfect in technique. Highly recommended.",
    quoteUr:
      "ڈاکٹر نسیم نے میری جلد پر کمال کام کیا۔ اُنہوں نے میرے چہرے کے لیے تین بار مائیکرو نیڈلنگ اور PRP کیا — نرمی کے ساتھ، اور تکنیک میں تقریباً بےعیب۔ میں پوری سفارش کروں گی۔",
  },
  {
    name: "Imran Z.",
    role: "Patient",
    roleUr: "مریض",
    quote:
      "The way you have treated me, I am thoroughly impressed. You very professionally dealt with varied opinions of other consultants and specialists, and provided such clinically honest care and treatment.",
    quoteUr:
      "آپ نے میرے ساتھ جو رویہ رکھا، میں اُس سے بےحد متاثر ہوا۔ آپ نے دوسرے ماہرین کی مختلف آرا کو نہایت پیشہ ورانہ انداز میں سنبھالا، اور اتنی دیانت دار طبی رہنمائی اور علاج فراہم کیا۔",
  },
  {
    name: "Jamal",
    role: "Patient",
    roleUr: "مریض",
    quote:
      "I visited Dr. Naseem Chaudhry three weeks back. He listened to all my problems very carefully. The medication he prescribed for depression is working very well.",
    quoteUr:
      "میں تین ہفتے پہلے ڈاکٹر نسیم چوہدری کے پاس گیا تھا۔ اُنہوں نے میرے سارے مسائل بہت غور سے سنے۔ ڈپریشن کے لیے جو دوا اُنہوں نے تجویز کی، وہ بہت اچھا اثر کر رہی ہے۔",
  },
  {
    name: "Owais",
    role: "Businessman",
    roleUr: "کاروباری شخصیت",
    quote:
      "It was a great experience with Dr. Naseem. Such a humble and great personality. 100% recommended.",
    quoteUr:
      "ڈاکٹر نسیم کے ساتھ تجربہ بہت اچھا رہا۔ کیا ہی منکسر المزاج اور عظیم شخصیت ہیں۔ 100% سفارش کرتا ہوں۔",
  },
];

export type ClinicValue = {
  title: string;
  titleUr: string;
  body: string;
  bodyUr: string;
};

export const clinicValues: ClinicValue[] = [
  {
    title: "Patient as part of the team",
    titleUr: "مریض بھی ٹیم کا حصہ",
    body: "We use a team approach to care and involve the patient as part of that team, every step of the way.",
    bodyUr:
      "ہم علاج میں ٹیم کے انداز سے کام کرتے ہیں اور ہر قدم پر مریض کو اُسی ٹیم کا حصہ بناتے ہیں۔",
  },
  {
    title: "Open access to the community",
    titleUr: "سب کے لیے کھلا دروازہ",
    body: "We're committed to serving the community and providing open access to the clinic for all community members.",
    bodyUr:
      "ہم اپنے معاشرے کی خدمت کے لیے پُرعزم ہیں اور کلینک کے دروازے ہر فرد کے لیے کھلے رکھتے ہیں۔",
  },
  {
    title: "Confidence that spreads",
    titleUr: "اعتماد جو آگے پھیلتا ہے",
    body: "By instilling confidence in our patients, they become positive forces in the community and contribute to the health of others.",
    bodyUr:
      "جب مریض میں اعتماد پیدا ہوتا ہے تو وہ معاشرے میں ایک مثبت قوت بن جاتا ہے اور دوسروں کی صحت میں بھی حصہ ڈالتا ہے۔",
  },
  {
    title: "Pursuit of excellence",
    titleUr: "بہتر سے بہتر کی تلاش",
    body: "In all we do, we actively pursue excellence and search for the next level of accomplishment. We take pride in our work.",
    bodyUr:
      "ہم جو بھی کرتے ہیں اُس میں بہترین کی تلاش جاری رکھتے ہیں اور اگلے درجے تک پہنچنے کی کوشش کرتے ہیں۔ ہمیں اپنے کام پر فخر ہے۔",
  },
  {
    title: "Integrity, always",
    titleUr: "دیانت، ہمیشہ",
    body: "Our integrity and ethics will never be compromised. Caring for people is our primary focus.",
    bodyUr:
      "ہماری دیانت اور اخلاقیات پر کبھی سمجھوتہ نہیں ہوگا۔ لوگوں کی دیکھ بھال ہی ہماری اصل ترجیح ہے۔",
  },
  {
    title: "Respect for one another",
    titleUr: "ایک دوسرے کا احترام",
    body: "We're as respectful, friendly, helpful, and supportive to one another as we are to our patients.",
    bodyUr:
      "ہم آپس میں بھی اُتنے ہی بااحترام، خوش اخلاق، مددگار اور ساتھ دینے والے ہیں جتنے اپنے مریضوں کے ساتھ۔",
  },
  {
    title: "Teamwork",
    titleUr: "مل کر کام کرنا",
    body: "Teamwork is central to our work — we each take responsibility to contribute effectively to the team.",
    bodyUr:
      "ٹیم ورک ہمارے کام کی بنیاد ہے — ہم میں سے ہر ایک ٹیم میں بھرپور حصہ ڈالنے کا ذمہ دار ہے۔",
  },
  {
    title: "Strong work ethic, real personality",
    titleUr: "محنت بھی، شخصیت بھی",
    body: "We have a strong work ethic, yet we don't stifle our individual personalities. Fun and humor are healthy for us and for our patients.",
    bodyUr:
      "ہم محنت سے کام کرتے ہیں، مگر اپنی شخصیت کو دبا نہیں دیتے۔ ہنسی مذاق ہمارے لیے بھی صحت مند ہے اور ہمارے مریضوں کے لیے بھی۔",
  },
];

export type Faq = {
  question: string;
  questionUr: string;
  answer: string;
  answerUr: string;
};

export const faqs: Faq[] = [
  {
    question: "How do I book an appointment?",
    questionUr: "ملاقات کیسے طے کروں؟",
    answer:
      "Use the Book Appointment button on any page, or call us at " +
      site.phone +
      ". In-clinic and telemedicine slots are both available.",
    answerUr:
      "کسی بھی صفحے پر موجود ”ملاقات طے کریں“ کا بٹن استعمال کریں، یا ہمیں " +
      site.phone +
      " پر کال کریں۔ کلینک میں آ کر ملاقات اور آن لائن ٹیلی میڈیسن، دونوں دستیاب ہیں۔",
  },
  {
    question: "Do you offer telemedicine consults?",
    questionUr: "کیا آپ آن لائن (ٹیلی میڈیسن) مشورہ دیتے ہیں؟",
    answer:
      "Yes — telemedicine consults run " +
      site.hours[1].value +
      ", " +
      site.hours[0].label +
      ", so you can be seen without visiting in person.",
    answerUr:
      "جی ہاں — ٹیلی میڈیسن مشورہ " +
      site.hours[1].valueUr +
      " دستیاب ہے، تاکہ آپ خود آئے بغیر ڈاکٹر سے بات کر سکیں۔",
  },
  {
    question: "What does TLC Med Clinics treat?",
    questionUr: "TLC میڈ کلینکس میں کن چیزوں کا علاج ہوتا ہے؟",
    answer:
      "We bring mental health, ketamine therapy and skin care together under one clinical team, led by " +
      site.doctor.name +
      ", so you aren't shuffled between disconnected specialists.",
    answerUr:
      "ہم ذہنی صحت، کیٹامین تھراپی اور جلد کے علاج کو ایک ہی طبی ٹیم کے تحت لے آتے ہیں، جس کی سربراہی " +
      site.doctor.nameUr +
      " کرتے ہیں — تاکہ آپ کو الگ الگ ماہرین کے درمیان بھٹکنا نہ پڑے۔",
  },
  {
    question: "Where is the clinic located?",
    questionUr: "کلینک کہاں واقع ہے؟",
    answer: site.address,
    answerUr: site.addressUr,
  },
  {
    question: "What should I expect at my first visit?",
    questionUr: "پہلی ملاقات میں کیا ہوتا ہے؟",
    answer:
      "Arrive 15 minutes early to complete check-in. Bring a list of your current medications, notes on treatments you have tried before, and any medical records you think will help. A first appointment is deliberately longer than a follow-up, so your history can be gone through properly before any medication is started.",
    answerUr:
      "چیک اِن مکمل کرنے کے لیے 15 منٹ پہلے پہنچ جائیں۔ اپنی موجودہ ادویات کی فہرست، پہلے آزمائے گئے علاج کی تفصیل، اور جو بھی طبی کاغذات مددگار لگیں، ساتھ لائیں۔ پہلی ملاقات جان بوجھ کر فالو اپ سے لمبی رکھی جاتی ہے، تاکہ کوئی دوا شروع کرنے سے پہلے آپ کی پوری تفصیل اطمینان سے دیکھی جا سکے۔",
  },
  {
    question: "What are your hours?",
    questionUr: "کلینک کے اوقات کیا ہیں؟",
    answer:
      site.hours[0].label + ", " + site.hours[0].value + ". Telemedicine consults run " + site.hours[1].value + ".",
    answerUr:
      site.hours[0].labelUr +
      "، " +
      site.hours[0].valueUr +
      "۔ ٹیلی میڈیسن مشورہ " +
      site.hours[1].valueUr +
      " دستیاب ہے۔",
  },
  {
    question: "Why choose TLC Med Clinics?",
    questionUr: "TLC میڈ کلینکس ہی کیوں؟",
    answer:
      "Care is led by a U.S. board certified physician with over 35 years of experience, using U.S. diagnosis and treatment protocols — in a clinic in Lahore, at local cost. We are also the first clinic of our kind in the city to offer ketamine therapy under physician supervision.",
    answerUr:
      "علاج کی سربراہی ایک امریکن بورڈ سے تصدیق شدہ معالج کرتے ہیں جن کا تجربہ 35 سال سے زائد ہے، اور تشخیص و علاج کے وہی امریکی ضوابط استعمال ہوتے ہیں — لاہور ہی کے ایک کلینک میں، مقامی خرچ پر۔ ہم شہر کے پہلے کلینک ہیں جہاں کیٹامین تھراپی ڈاکٹر کی نگرانی میں دی جاتی ہے۔",
  },
  {
    question: "Do I need a referral?",
    questionUr: "کیا کسی ریفرل کی ضرورت ہے؟",
    answer:
      "No. You can book an initial evaluation directly, in the clinic or by telemedicine, and the doctor will tell you what care you need from there.",
    answerUr:
      "نہیں۔ آپ براہِ راست پہلی جانچ کے لیے ملاقات طے کر سکتے ہیں — کلینک میں یا آن لائن — اور اُس کے بعد ڈاکٹر خود بتائیں گے کہ آگے کس علاج کی ضرورت ہے۔",
  },
  {
    question: "Is my consultation confidential?",
    questionUr: "کیا میری بات خفیہ رہے گی؟",
    answer:
      "Yes. Telemedicine sessions are encrypted per session, and your records are visible only to you and your treating clinician. Nothing is shared without your consent.",
    answerUr:
      "جی ہاں۔ ٹیلی میڈیسن کا ہر سیشن الگ سے خفیہ کوڈ میں محفوظ ہوتا ہے، اور آپ کا ریکارڈ صرف آپ کو اور آپ کا علاج کرنے والے معالج کو نظر آتا ہے۔ آپ کی اجازت کے بغیر کچھ بھی کسی کے ساتھ نہیں بانٹا جاتا۔",
  },
  {
    question: "Can I bring my child to the appointment?",
    questionUr: "کیا میں اپنے بچے کو ساتھ لا سکتا ہوں؟",
    answer:
      "Yes — and if the appointment is for your child, please come with them. We treat adolescent problems, ADHD and children's developmental concerns, and a parent's account of what has been happening is part of the assessment.",
    answerUr:
      "جی ہاں — اور اگر ملاقات آپ کے بچے کے لیے ہے تو براہِ کرم اُس کے ساتھ ضرور آئیں۔ ہم نوجوانی کے مسائل، ADHD اور بچوں کی نشوونما سے متعلق پریشانیوں کا علاج کرتے ہیں، اور والدین کی بتائی ہوئی بات جانچ کا ایک اہم حصہ ہوتی ہے۔",
  },
  {
    question: "How do I pay?",
    questionUr: "ادائیگی کیسے کروں؟",
    answer:
      "Online, through the secure checkout when you book. Card details are handled by the payment provider and are never stored on our servers. Some treatments take a PKR 5,000 advance to hold the appointment, with the balance settled at the visit.",
    answerUr:
      "ملاقات طے کرتے وقت آن لائن، محفوظ چیک آؤٹ کے ذریعے۔ کارڈ کی تفصیلات ادائیگی کا ادارہ خود سنبھالتا ہے اور وہ کبھی ہمارے سرور پر محفوظ نہیں ہوتیں۔ کچھ علاج کے لیے وقت محفوظ رکھنے کی خاطر 5,000 روپے پیشگی لیے جاتے ہیں، باقی رقم ملاقات کے وقت۔",
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
 *
 * These carry their own Urdu rather than dictionary keys because each label is
 * the name of one specific page and belongs beside the href it points at. A key
 * would put the two halves of the same fact in two files.
 */
export const footerColumns: {
  heading: string;
  headingUr: string;
  links: { href: string; label: string; labelUr: string }[];
}[] = [
  {
    heading: "Telemedicine",
    headingUr: "ٹیلی میڈیسن",
    links: [
      {
        href: "/telemedicine/what-is-telemedicine",
        label: "What is Telemedicine?",
        labelUr: "ٹیلی میڈیسن کیا ہے؟",
      },
      { href: "/telemedicine/benefits", label: "Benefits", labelUr: "فوائد" },
      {
        href: "/telemedicine/how-it-works",
        label: "How does it work?",
        labelUr: "یہ کام کیسے کرتا ہے؟",
      },
      {
        href: "/patient/book",
        label: "Schedule & pay online",
        labelUr: "آن لائن وقت لیں اور ادائیگی کریں",
      },
      { href: "/privacy", label: "Privacy practices", labelUr: "رازداری کی پالیسی" },
      { href: "/terms", label: "Terms of service", labelUr: "شرائطِ استعمال" },
    ],
  },
  {
    heading: "Conditions",
    headingUr: "امراض",
    links: [
      {
        href: "/conditions/mental-disorders",
        label: "Mental disorders",
        labelUr: "ذہنی امراض",
      },
      {
        href: "/conditions/major-depressive-disorder",
        label: "Depression",
        labelUr: "ڈپریشن",
      },
      {
        href: "/conditions/generalized-anxiety-disorder",
        label: "Anxiety",
        labelUr: "بے چینی اور گھبراہٹ",
      },
      { href: "/conditions/acne-scars", label: "Acne scars", labelUr: "کیل مہاسوں کے نشان" },
      {
        href: "/conditions/hair-thinning-hair-loss",
        label: "Hair thinning & hair loss",
        labelUr: "بالوں کا پتلا ہونا اور گرنا",
      },
      { href: "/conditions", label: "View all", labelUr: "سب دیکھیں" },
    ],
  },
  {
    heading: "Treatments",
    headingUr: "علاج",
    links: [
      {
        href: "/treatments/ketamine-therapy",
        label: "Ketamine therapy",
        labelUr: "کیٹامین تھراپی",
      },
      {
        href: "/treatments/psychiatric-consultation",
        label: "Psychiatric consultation",
        labelUr: "نفسیاتی مشورہ",
      },
      { href: "/treatments/botox", label: "Botox", labelUr: "بوٹوکس" },
      {
        href: "/treatments/micro-needling-with-prp",
        label: "Micro-needling with PRP",
        labelUr: "مائیکرو نیڈلنگ بمع PRP",
      },
      {
        href: "/treatments/hair-regrowth-with-prp",
        label: "Hair regrowth with PRP",
        labelUr: "PRP سے بالوں کی دوبارہ نشوونما",
      },
      { href: "/treatments", label: "View all", labelUr: "سب دیکھیں" },
    ],
  },
  {
    heading: "Clinic",
    headingUr: "کلینک",
    links: [
      {
        href: "/what-to-expect/first-time-consultation",
        label: "First-time consultation",
        labelUr: "پہلی ملاقات",
      },
      { href: "/what-to-expect/costs", label: "Costs", labelUr: "اخراجات" },
      {
        href: "/what-to-expect/patient-forms",
        label: "Patient forms",
        labelUr: "مریض کے فارم",
      },
      { href: "/about/our-doctors", label: "Our doctors", labelUr: "ہمارے ڈاکٹر" },
      { href: "/faq", label: "FAQ & answers", labelUr: "عام سوالات اور جوابات" },
      { href: "/contact", label: "Contact", labelUr: "رابطہ" },
    ],
  },
];
