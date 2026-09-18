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
    titleUr: "پہلی ملاقات",
    summary:
      "What to bring, what to expect, and how your first appointment is structured.",
    summaryUr:
      "ساتھ کیا لانا ہے، کیا توقع رکھنی ہے، اور آپ کی پہلی ملاقات کس ترتیب سے ہوتی ہے۔",
    group: "what-to-expect",
    blocks: [
      {
        kind: "h",
        text: "Walk in prepared, walk out informed",
        textUr: "تیاری کے ساتھ آئیں، جواب لے کر جائیں",
      },
      {
        kind: "p",
        text: "We want you to feel comfortable and confident on your first visit, with a clear understanding of what to expect. Please arrive 15 minutes before your appointment time to complete check-in and your new patient forms. You can print the patient history form from this site, fill it in at home and bring it with you — it saves time on the day.",
        textUr:
          "ہم چاہتے ہیں کہ پہلی ملاقات میں آپ آرام محسوس کریں، پُراعتماد رہیں، اور آپ کو صاف معلوم ہو کہ کیا ہونے والا ہے۔ براہِ کرم اپنے مقررہ وقت سے 15 منٹ پہلے پہنچیں، تاکہ آمد کا اندراج اور نئے مریض کے فارم مکمل ہو سکیں۔ مریض کی طبی تاریخ کا فارم آپ اسی ویب سائٹ سے پرنٹ کر کے گھر پر بھر سکتے ہیں اور ساتھ لا سکتے ہیں — اس سے اُس دن وقت بچ جاتا ہے۔",
      },
      {
        kind: "h",
        text: "Bring on the day of your first visit",
        textUr: "پہلی ملاقات کے دن ساتھ لائیں",
      },
      {
        kind: "ul",
        items: [
          "A list of your current medications",
          "Information about treatments and medications you have tried in the past",
          "Medical records from prior visits that you think may be helpful",
        ],
        itemsUr: [
          "اپنی موجودہ ادویات کی فہرست",
          "پہلے آزمائے گئے علاج اور ادویات کی تفصیل",
          "پچھلی ملاقاتوں کے وہ طبی کاغذات جو آپ کے خیال میں کام آ سکتے ہیں",
        ],
      },
      { kind: "h", text: "Your appointment", textUr: "آپ کی ملاقات" },
      {
        kind: "p",
        text: "For a mental health appointment you will meet an American Board Certified psychiatrist with over 30 years of experience, ranked a 'top doctor' in the United States in his field by his peers. He regularly provides telemedicine consultations to patients around the world as well as in-person consultations in Lahore.",
        textUr:
          "ذہنی صحت کی ملاقات میں آپ ایک امریکن بورڈ سرٹیفائیڈ ماہرِ نفسیات سے ملیں گے، جنہیں 30 سال سے زیادہ کا تجربہ ہے اور جنہیں امریکہ میں ان کے اپنے شعبے کے ساتھی ڈاکٹروں نے ”ٹاپ ڈاکٹر“ قرار دیا ہے۔ وہ باقاعدگی سے دنیا بھر کے مریضوں کو ٹیلی میڈیسن کے ذریعے مشورہ دیتے ہیں، اور لاہور میں روبرو بھی مریض دیکھتے ہیں۔",
      },
      {
        kind: "p",
        text: "The first appointment is longer than a follow-up, on purpose — so your history and background can be gone through thoroughly. You will get an in-depth analysis and understanding of the core issues before any medication is started.",
        textUr:
          "پہلی ملاقات جان بوجھ کر بعد کی ملاقاتوں سے لمبی رکھی جاتی ہے — تاکہ آپ کی طبی تاریخ اور پس منظر تفصیل سے دیکھا جا سکے۔ کوئی دوا شروع کرنے سے پہلے آپ کو اصل مسائل کا گہرا جائزہ اور اُن کی پوری سمجھ ملے گی۔",
      },
      { kind: "h", text: "Costs", textUr: "اخراجات" },
      {
        kind: "p",
        text: "You will also speak to an office manager about the cost of treatment as it applies to your diagnosis and plan, and about when treatment will begin. Current consultation fees are listed on the Costs page.",
        textUr:
          "آپ کی بات دفتر کے منیجر سے بھی ہوگی، جو آپ کی تشخیص اور علاج کے منصوبے کے حساب سے علاج کے اخراجات بتائیں گے، اور یہ بھی کہ علاج کب شروع ہوگا۔ مشورے کی موجودہ فیس ”اخراجات“ والے صفحے پر درج ہے۔",
      },
    ],
  },
  {
    slug: "telemedicine-consult",
    title: "Telemedicine Consult",
    titleUr: "ٹیلی میڈیسن مشاورت",
    summary: "Getting answers from home — how an online consultation runs.",
    summaryUr:
      "گھر بیٹھے جواب — آن لائن مشورہ کس طرح ہوتا ہے۔",
    group: "what-to-expect",
    blocks: [
      {
        kind: "p",
        text: "Telemedicine is healthcare conducted remotely, by phone or over the internet. It lets you have a virtual appointment with our doctors without travelling to the clinic.",
        textUr:
          "ٹیلی میڈیسن سے مراد وہ علاج ہے جو دور بیٹھے، فون یا انٹرنیٹ کے ذریعے کیا جائے۔ اس سے آپ کلینک آئے بغیر ہمارے ڈاکٹروں سے آن لائن ملاقات کر سکتے ہیں۔",
      },
      {
        kind: "h",
        text: "The process is as simple as 1, 2, 3",
        textUr: "طریقہ صرف 1، 2، 3 جتنا آسان ہے",
      },
      {
        kind: "ol",
        items: [
          "Book online from this website, or call the clinic.",
          "Pay your fee online through our secure checkout.",
          "Open your dashboard at the appointment time and join the call.",
        ],
        itemsUr: [
          "اسی ویب سائٹ سے آن لائن وقت لیں، یا کلینک کو فون کریں۔",
          "اپنی فیس ہمارے محفوظ آن لائن چیک آؤٹ کے ذریعے ادا کریں۔",
          "مقررہ وقت پر اپنا ڈیش بورڈ کھولیں اور کال میں شامل ہو جائیں۔",
        ],
      },
      { kind: "h", text: "What you need", textUr: "آپ کو کیا درکار ہوگا" },
      {
        kind: "ul",
        items: [
          "A reasonable internet connection",
          "A phone, tablet or computer with a camera",
          "A microphone — most devices have one built in",
        ],
        itemsUr: [
          "ٹھیک ٹھاک انٹرنیٹ کنکشن",
          "کیمرے والا فون، ٹیبلٹ یا کمپیوٹر",
          "ایک مائیکروفون — زیادہ تر آلات میں پہلے سے موجود ہوتا ہے",
        ],
      },
      {
        kind: "note",
        text: "We do not store credit card, debit card or bank details on our servers. Payments are handled by the payment provider.",
        textUr:
          "ہم کریڈٹ کارڈ، ڈیبٹ کارڈ یا بینک کی تفصیلات اپنے سرورز پر محفوظ نہیں کرتے۔ ادائیگی کا انتظام ادائیگی فراہم کرنے والا ادارہ سنبھالتا ہے۔",
      },
    ],
  },
  {
    slug: "comprehensive-care",
    title: "Comprehensive Care",
    titleUr: "مکمل دیکھ بھال",
    summary:
      "Short- and long-term care, and why every treatment plan here is different.",
    summaryUr:
      "مختصر اور طویل مدت کی دیکھ بھال، اور یہ کہ یہاں ہر مریض کے علاج کا منصوبہ الگ کیوں ہوتا ہے۔",
    group: "what-to-expect",
    blocks: [
      {
        kind: "h",
        text: "Every patient is different",
        textUr: "ہر مریض الگ ہوتا ہے",
      },
      {
        kind: "p",
        text: "Whether your goals are cosmetic, health-related or about general wellness, the aim is to get you back to your usual life as soon as possible — and our treatment plans are built around that rather than around a standard package.",
        textUr:
          "آپ کا مقصد خوبصورتی سے جڑا ہو، صحت سے، یا عمومی تندرستی سے — کوشش یہی ہوتی ہے کہ آپ جلد از جلد اپنی معمول کی زندگی میں واپس آ جائیں۔ ہمارے علاج کے منصوبے اسی بات کو سامنے رکھ کر بنتے ہیں، کسی بندھے بندھائے پیکج کے مطابق نہیں۔",
      },
      {
        kind: "p",
        text: "This is why we don't publish an average number of sessions for a course of treatment. The honest answer only exists after an examination, and a number quoted before that is a guess dressed up as information.",
        textUr:
          "یہی وجہ ہے کہ ہم علاج کے کسی کورس کے لیے سیشنز کی اوسط تعداد شائع نہیں کرتے۔ سچا جواب معائنے کے بعد ہی ممکن ہے، اور اس سے پہلے بتایا گیا کوئی بھی عدد محض اندازہ ہوتا ہے جسے معلومات کا لباس پہنا دیا گیا ہو۔",
      },
      {
        kind: "h",
        text: "Follow-up matters as much as treatment",
        textUr: "بعد کی ملاقاتیں بھی علاج جتنی ہی اہم ہیں",
      },
      {
        kind: "p",
        text: "Our follow-up programme is designed to identify and address issues early, which is what produces good long-term results. For mental health in particular, the regular review is not an add-on to treatment — it is the treatment.",
        textUr:
          "ہماری فالو اپ ملاقاتوں کا مقصد یہ ہے کہ مسائل کو جلد پہچان کر جلد حل کیا جائے، اور لمبے عرصے کے اچھے نتائج اسی سے نکلتے ہیں۔ خاص طور پر ذہنی صحت میں، باقاعدہ جائزہ علاج کے ساتھ لگا ہوا کوئی اضافی حصہ نہیں — وہی اصل علاج ہے۔",
      },
      { kind: "h", text: "Other services", textUr: "دیگر خدمات" },
      {
        kind: "p",
        text: "We also offer complete medical and diagnostic services alongside mental health and skin care. If you are unsure which is relevant to you, book an initial evaluation and we will point you in the right direction.",
        textUr:
          "ذہنی صحت اور جلد کے علاج کے ساتھ ساتھ ہم مکمل طبی اور تشخیصی خدمات بھی فراہم کرتے ہیں۔ اگر آپ کو یقین نہ ہو کہ آپ کے لیے کون سی خدمت درست ہے تو ابتدائی معائنے کا وقت لے لیں، ہم آپ کو صحیح راستہ بتا دیں گے۔",
      },
    ],
  },
  {
    slug: "costs",
    title: "Costs",
    titleUr: "اخراجات",
    summary: "Consultation and treatment fees, stated plainly.",
    summaryUr: "مشورے اور علاج کی فیس، صاف صاف درج۔",
    group: "what-to-expect",
    blocks: [
      {
        kind: "p",
        text: "For a mental health appointment you will meet an American Board Certified psychiatrist with over 35 years of experience, ranked a 'top doctor' in the United States in his field by his peers.",
        textUr:
          "ذہنی صحت کی ملاقات میں آپ ایک امریکن بورڈ سرٹیفائیڈ ماہرِ نفسیات سے ملیں گے، جنہیں 35 سال سے زیادہ کا تجربہ ہے اور جنہیں امریکہ میں ان کے اپنے شعبے کے ساتھی ڈاکٹروں نے ”ٹاپ ڈاکٹر“ قرار دیا ہے۔",
      },
      // Whole categories, so a service the clinic adds in the admin panel
      // appears here the same day without anyone editing this file.
      {
        kind: "prices",
        caption: "Diagnosis",
        captionUr: "تشخیص",
        category: "Diagnosis",
      },
      {
        kind: "prices",
        caption: "Consultation fees",
        captionUr: "مشورے کی فیس",
        category: "Mental Health",
      },
      {
        kind: "prices",
        caption: "Treatments",
        captionUr: "علاج",
        category: "Skin & Aesthetics",
      },
      {
        kind: "note",
        text: "Where a treatment shows an amount to book, that is the advance taken online to hold the appointment; the balance is settled at the visit.",
        textUr:
          "جہاں کسی علاج کے ساتھ بکنگ کی رقم لکھی ہو، وہ آن لائن لی جانے والی پیشگی رقم ہے جو آپ کا وقت محفوظ رکھنے کے لیے ہوتی ہے؛ باقی رقم ملاقات کے وقت ادا کی جاتی ہے۔",
      },
    ],
  },
  {
    slug: "patient-forms",
    title: "Patient Forms & Guidance",
    titleUr: "مریض کے فارم اور رہنمائی",
    summary: "The forms to bring, and where to find answers before you visit.",
    summaryUr:
      "ساتھ لانے والے فارم، اور آنے سے پہلے جوابات کہاں سے ملیں گے۔",
    group: "what-to-expect",
    blocks: [
      { kind: "h", text: "Patient history", textUr: "مریض کی طبی تاریخ" },
      {
        kind: "p",
        text: "We ask about your symptoms and lifestyle so we can understand your condition, concerns and goals properly. We also ask about your general health, medications and allergies. Completing the patient history form at home and bringing it with you saves time at your first appointment.",
        textUr:
          "ہم آپ کی علامات اور طرزِ زندگی کے بارے میں سوال کرتے ہیں تاکہ آپ کی بیماری، آپ کے خدشات اور آپ کے مقاصد کو ٹھیک سے سمجھ سکیں۔ ہم آپ کی عمومی صحت، ادویات اور الرجی کے بارے میں بھی پوچھتے ہیں۔ مریض کی طبی تاریخ کا فارم گھر پر بھر کر ساتھ لے آنے سے پہلی ملاقات میں وقت بچ جاتا ہے۔",
      },
      {
        kind: "h",
        text: "Authorisation for communication",
        textUr: "رابطے کی اجازت",
      },
      {
        kind: "p",
        text: "We ask for basic information about the best way to contact you and your family over the course of your treatment.",
        textUr:
          "ہم بنیادی معلومات لیتے ہیں کہ علاج کے دوران آپ سے اور آپ کے گھر والوں سے رابطہ کرنے کا بہترین طریقہ کیا ہے۔",
      },
      {
        kind: "note",
        text: "Both forms are available from the clinic — call us and we will send them to you before your visit. See the FAQ page for answers to the questions patients most often ask before a first appointment.",
        textUr:
          "دونوں فارم کلینک سے مل سکتے ہیں — ہمیں فون کریں، ہم آپ کی ملاقات سے پہلے آپ کو بھیج دیں گے۔ پہلی ملاقات سے پہلے مریض جو سوال سب سے زیادہ پوچھتے ہیں، ان کے جواب FAQ کے صفحے پر موجود ہیں۔",
      },
    ],
  },
];
