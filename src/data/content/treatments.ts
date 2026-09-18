import type { ContentPage } from "./types";

/**
 * The treatments offered, with their published prices.
 *
 * Prices are stated here because a patient's first question is almost always
 * "what does it cost?", and a clinic that makes people phone to find out loses
 * the ones who won't. They are duplicated from the booking form on purpose —
 * these pages are read by people who have not started booking yet.
 *
 * Vein procedures (ultrasound-guided injection, surgical removal, EVLT) are
 * absent: the clinic no longer offers them.
 */

const MENTAL = "Mental health";
const MENTAL_UR = "ذہنی صحت";
const AESTHETIC = "Aesthetic";
const AESTHETIC_UR = "خوبصورتی کے علاج";

export const treatmentPages: ContentPage[] = [
  {
    slug: "ketamine-therapy",
    title: "Ketamine Therapy",
    titleUr: "کیٹامین تھراپی",
    summary:
      "Ketamine infusion for depression, PTSD, OCD, anxiety and chronic pain — the first clinic of its kind in Lahore.",
    summaryUr:
      "ڈپریشن، PTSD، OCD، بے چینی (anxiety) اور دیرینہ درد کے لیے کیٹامین انفیوژن — لاہور میں اپنی نوعیت کا پہلا کلینک۔",
    group: "treatments",
    section: MENTAL,
    sectionUr: MENTAL_UR,
    blocks: [
      {
        kind: "p",
        text: "We offer a personalised approach to mental health treatment, with ketamine infusion for depression, suicidal thinking, post-traumatic stress disorder (PTSD), anxiety disorders, postpartum depression, obsessive-compulsive disorder (OCD), chronic pain, substance abuse disorders and other mood disorders.",
        textUr:
          "ہم ذہنی صحت کے علاج میں ہر مریض کے لیے الگ اور ذاتی نوعیت کا طریقہ اختیار کرتے ہیں۔ ڈپریشن، خودکشی کے خیالات، صدمے کے بعد کا ذہنی دباؤ (PTSD)، بے چینی کی بیماریوں (anxiety disorders)، زچگی کے بعد کے ڈپریشن، وسوسوں اور بار بار کے خیالات کی بیماری (OCD)، دیرینہ درد، نشے کی لت اور مزاج کی دیگر بیماریوں کے لیے کیٹامین انفیوژن دستیاب ہے۔",
      },
      {
        kind: "p",
        text: "Ours is the first clinic of its kind in Lahore, run and supervised by U.S. board certified physicians — providing safe, effective and world-class treatment with the best outcomes.",
        textUr:
          "یہ لاہور میں اپنی نوعیت کا پہلا کلینک ہے، جو امریکہ کے بورڈ سرٹیفائیڈ ڈاکٹروں کی نگرانی میں چلتا ہے — محفوظ، مؤثر اور عالمی معیار کا علاج، بہترین نتائج کے ساتھ۔",
      },
      {
        kind: "prices",
        caption: "Session",
        captionUr: "سیشن",
        slugs: ["ketamine-therapy"],
      },
      {
        kind: "note",
        text: "Ketamine therapy is given under physician supervision, and starts with an evaluation — it is not something to book without one. Your first visit will establish whether it is right for you.",
        textUr:
          "کیٹامین تھراپی ڈاکٹر کی نگرانی میں دی جاتی ہے اور اس کی شروعات ایک معائنے سے ہوتی ہے — یہ ایسا علاج نہیں جو معائنے کے بغیر بک کیا جائے۔ آپ کی پہلی ملاقات میں یہ طے ہوگا کہ یہ آپ کے لیے موزوں ہے یا نہیں۔",
      },
    ],
  },
  {
    slug: "psychiatric-consultation",
    title: "Psychiatric Consultation & Therapy",
    titleUr: "نفسیاتی مشورہ اور تھراپی",
    summary:
      "Evaluation, medication management and therapy with an American Board Certified psychiatrist.",
    summaryUr:
      "امریکن بورڈ سرٹیفائیڈ ماہرِ نفسیات کے ساتھ معائنہ، ادویات کا انتظام اور تھراپی۔",
    group: "treatments",
    section: MENTAL,
    sectionUr: MENTAL_UR,
    blocks: [
      {
        kind: "p",
        text: "You will meet an American Board Certified psychiatrist with over 35 years of experience, ranked a 'top doctor' in the United States by his peers. First appointments are deliberately longer, so your history and background can be gone through thoroughly before any medication is started.",
        textUr:
          "آپ کی ملاقات ایک امریکن بورڈ سرٹیفائیڈ ماہرِ نفسیات سے ہوگی، جنہیں 35 سال سے زیادہ کا تجربہ ہے اور جنہیں امریکہ میں ان کے ساتھی ڈاکٹروں نے ”ٹاپ ڈاکٹر“ قرار دیا ہے۔ پہلی ملاقات جان بوجھ کر لمبی رکھی جاتی ہے، تاکہ کوئی دوا شروع کرنے سے پہلے آپ کی طبی تاریخ اور پس منظر تفصیل سے سنا جا سکے۔",
      },
      {
        kind: "prices",
        caption: "Consultation fees",
        captionUr: "مشورے کی فیس",
        slugs: [
          "initial-evaluation",
          "regular-follow-up",
          "therapy-med-management-30",
          "therapy-med-management-60",
        ],
      },
      {
        kind: "p",
        text: "Consultations are available in the clinic or by telemedicine, with the same doctor either way.",
        textUr:
          "مشورہ کلینک میں بھی لیا جا سکتا ہے اور ٹیلی میڈیسن کے ذریعے بھی — دونوں صورتوں میں ڈاکٹر وہی ہوں گے۔",
      },
    ],
  },
  {
    slug: "botox",
    title: "Botox",
    titleUr: "بوٹوکس",
    summary:
      "Botulinum toxin for crow's feet, glabellar lines, marionette lines and wrinkles.",
    summaryUr:
      "آنکھوں کے کناروں کی لکیروں (crow's feet)، بھنوؤں کے درمیان کی لکیروں، منہ کے کناروں کی لکیروں اور جھریوں کے لیے بوٹولینم ٹاکسن۔",
    group: "treatments",
    section: AESTHETIC,
    sectionUr: AESTHETIC_UR,
    blocks: [
      {
        kind: "p",
        text: "Botox relaxes the muscles beneath the skin, which makes the lines they create less noticeable. It is used here for crow's feet, glabellar lines, marionette lines, wrinkles and sagging, and for the puckering that sometimes surrounds acne scars.",
        textUr:
          "بوٹوکس جِلد کے نیچے کے پٹھوں کو ڈھیلا کر دیتا ہے، جس سے ان پٹھوں کی بنائی ہوئی لکیریں کم نمایاں ہو جاتی ہیں۔ یہاں یہ آنکھوں کے کناروں کی لکیروں (crow's feet)، بھنوؤں کے درمیان کی لکیروں، منہ کے کناروں سے نیچے جاتی لکیروں، جھریوں اور ڈھلکتی جِلد کے لیے استعمال ہوتا ہے، اور اس سُکڑن کے لیے بھی جو کبھی کبھی کیل مہاسوں کے نشانات کے گرد بن جاتی ہے۔",
      },
      {
        kind: "p",
        text: "Compared with other procedures it is affordable, and the risk of side effects is minimal. The effect is temporary, so treatment is repeated periodically.",
        textUr:
          "دوسرے طریقوں کے مقابلے میں یہ کم خرچ ہے، اور مضر اثرات کا خطرہ بہت کم ہے۔ اس کا اثر عارضی ہوتا ہے، اس لیے علاج وقفے وقفے سے دہرایا جاتا ہے۔",
      },
      {
        kind: "prices",
        caption: "Fees",
        captionUr: "فیس",
        slugs: [
          "botox-50-units",
          "botox-100-units",
          "lip-flip-botox",
          "lip-flip-botox-filler",
        ],
      },
    ],
  },
  {
    slug: "dermal-fillers",
    title: "Dermal Fillers",
    titleUr: "ڈرمل فلرز",
    summary:
      "Soft tissue fillers that restore volume and soften folds, indentations and scars.",
    summaryUr:
      "نرم بافتوں کے فلرز، جو جِلد کا حجم واپس لاتے ہیں اور سلوٹوں، گڑھوں اور نشانات کو کم نمایاں کرتے ہیں۔",
    group: "treatments",
    section: AESTHETIC,
    sectionUr: AESTHETIC_UR,
    blocks: [
      {
        kind: "p",
        text: "Soft tissue fillers mimic the collagen and other structural components of your skin. Injected under indented scars they fill out or stretch the skin, making the scars less noticeable; used in the face they restore volume lost with age.",
        textUr:
          "نرم بافتوں کے فلرز آپ کی جِلد کے کولیجن اور دیگر بنیادی اجزاء جیسا کام کرتے ہیں۔ گڑھے دار نشانات کے نیچے لگائے جائیں تو یہ جِلد کو بھر دیتے یا کھینچ دیتے ہیں، جس سے نشان کم دکھائی دیتے ہیں؛ چہرے پر لگائے جائیں تو عمر کے ساتھ کم ہو جانے والا حجم واپس لاتے ہیں۔",
      },
      {
        kind: "p",
        text: "We use fillers for nasolabial folds, marionette lines, crow's feet, wrinkles and sagging, and for acne scarring. Results are temporary, so injections are repeated periodically.",
        textUr:
          "ہم فلرز ناک سے منہ تک آنے والی سلوٹوں (nasolabial folds)، منہ کے کناروں کی لکیروں، آنکھوں کے کناروں کی لکیروں، جھریوں اور ڈھلکتی جِلد کے لیے، اور کیل مہاسوں کے نشانات کے لیے استعمال کرتے ہیں۔ نتائج عارضی ہوتے ہیں، اس لیے انجکشن وقفے وقفے سے دہرائے جاتے ہیں۔",
      },
    ],
  },
  {
    slug: "micro-needling-with-prp",
    title: "Micro-needling with PRP",
    titleUr: "PRP کے ساتھ مائیکرو نیڈلنگ",
    summary:
      "Full-face micro-needling with platelet-rich plasma, for acne scars, wrinkles, age spots and sun damage.",
    summaryUr:
      "پورے چہرے کی مائیکرو نیڈلنگ، پلیٹ لیٹ رچ پلازما (PRP) کے ساتھ — کیل مہاسوں کے نشانات، جھریوں، عمر کے دھبوں اور دھوپ سے ہونے والے نقصان کے لیے۔",
    group: "treatments",
    section: AESTHETIC,
    sectionUr: AESTHETIC_UR,
    blocks: [
      {
        kind: "p",
        text: "A needle-studded device is rolled over the skin to stimulate the tissue underneath, combined with platelet-rich plasma drawn from your own blood. It is a safe, simple technique for acne scarring — the result is subtle, and treatments are usually repeated.",
        textUr:
          "باریک سوئیوں والا ایک آلہ جِلد پر پھیرا جاتا ہے تاکہ نیچے کی بافتیں متحرک ہوں، اور اس کے ساتھ آپ ہی کے خون سے نکالا گیا پلیٹ لیٹ رچ پلازما (PRP) ملایا جاتا ہے۔ کیل مہاسوں کے نشانات کے لیے یہ ایک محفوظ اور سادہ طریقہ ہے — نتیجہ ہلکا ہوتا ہے، اور علاج عام طور پر دہرایا جاتا ہے۔",
      },
      {
        kind: "p",
        text: "The same treatment is used for wrinkles, age spots and sun damage across the full face.",
        textUr:
          "یہی علاج پورے چہرے پر جھریوں، عمر کے دھبوں اور دھوپ سے ہونے والے نقصان کے لیے بھی کیا جاتا ہے۔",
      },
      {
        kind: "prices",
        caption: "Full face micro-needling with PRP",
        captionUr: "پورے چہرے کی مائیکرو نیڈلنگ PRP کے ساتھ",
        slugs: ["micro-needling-with-prp"],
      },
    ],
  },
  {
    slug: "hair-regrowth-with-prp",
    title: "Hair Regrowth with PRP",
    titleUr: "PRP سے بالوں کی دوبارہ نشوونما",
    summary:
      "Platelet-rich plasma injected into the scalp to bring inactive hair back into growth.",
    summaryUr:
      "سر کی جِلد میں پلیٹ لیٹ رچ پلازما (PRP) کا انجکشن، تاکہ سوئے ہوئے بال دوبارہ اُگنے لگیں۔",
    group: "treatments",
    section: AESTHETIC,
    sectionUr: AESTHETIC_UR,
    blocks: [
      {
        kind: "p",
        text: "Your blood is drawn and carefully processed to extract plasma rich in growth factors, which is then injected into the scalp. Those platelets prompt inactive or newly implanted hair to enter an active growth phase.",
        textUr:
          "آپ کا خون لے کر احتیاط سے اس پر کام کیا جاتا ہے تاکہ نشوونما کے عوامل (growth factors) سے بھرپور پلازما نکالا جا سکے، جو پھر سر کی جِلد میں لگایا جاتا ہے۔ یہ پلیٹ لیٹس غیر فعال یا نئے لگائے گئے بالوں کو اُگنے کے فعال مرحلے میں لے آتے ہیں۔",
      },
      {
        kind: "prices",
        caption: "Hair regrowth with PRP",
        captionUr: "PRP سے بالوں کی دوبارہ نشوونما",
        slugs: ["hair-regrowth-with-prp"],
      },
    ],
  },
  {
    slug: "prf-treatments",
    title: "PRF Treatments",
    titleUr: "PRF کے علاج",
    summary:
      "Platelet-rich fibrin for dark circles and eye bags, nasolabial folds and lips.",
    summaryUr:
      "آنکھوں کے نیچے حلقوں اور سوجن، ناک سے منہ تک کی سلوٹوں اور ہونٹوں کے لیے پلیٹ لیٹ رچ فائبرن (PRF)۔",
    group: "treatments",
    section: AESTHETIC,
    sectionUr: AESTHETIC_UR,
    blocks: [
      {
        kind: "p",
        text: "PRF — platelet-rich fibrin — is prepared from your own blood and used to restore volume and skin quality in the most delicate areas of the face, where a heavier filler would be too much.",
        textUr:
          "PRF — یعنی پلیٹ لیٹ رچ فائبرن — آپ ہی کے خون سے تیار کیا جاتا ہے اور چہرے کے سب سے نازک حصوں میں حجم اور جِلد کی رنگت و کیفیت بہتر کرنے کے لیے استعمال ہوتا ہے، جہاں کوئی بھاری فلر زیادہ ہو جاتا ہے۔",
      },
      {
        kind: "prices",
        caption: "Fees",
        captionUr: "فیس",
        slugs: ["prf-under-eyes", "prf-nasolabial-folds", "prf-lips"],
      },
    ],
  },
  {
    slug: "lipolytic-injection",
    title: "Lipolytic Injection (Kybella)",
    titleUr: "لائپولیٹک انجکشن (Kybella)",
    summary: "Injection treatment for a double chin.",
    summaryUr: "ٹھوڑی کے نیچے جمی چربی (double chin) کے لیے انجکشن کا علاج۔",
    group: "treatments",
    section: AESTHETIC,
    sectionUr: AESTHETIC_UR,
    blocks: [
      {
        kind: "p",
        text: "A lipolytic injection treatment for submental fullness — a double chin — given in the clinic. More than one treatment is usually needed, and your doctor will tell you how many to expect after examining you.",
        textUr:
          "ٹھوڑی کے نیچے جمی چربی — یعنی ڈبل چِن — کے لیے لائپولیٹک انجکشن کا علاج، جو کلینک میں دیا جاتا ہے۔ عام طور پر ایک سے زیادہ بار علاج کی ضرورت پڑتی ہے، اور معائنے کے بعد آپ کے ڈاکٹر آپ کو بتائیں گے کہ کتنی بار درکار ہوں گے۔",
      },
      {
        kind: "prices",
        caption: "Fees",
        captionUr: "فیس",
        slugs: ["lipolytic-injection"],
      },
    ],
  },
];
