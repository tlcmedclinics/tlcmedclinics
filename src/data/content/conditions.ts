import type { ContentPage } from "./types";

/**
 * Conditions the clinic treats.
 *
 * Vein and circulation conditions are deliberately absent — the clinic no
 * longer offers vein care, and a condition page for something nobody here
 * treats sends a patient down a corridor with no door at the end.
 */

const MENTAL_HEALTH = "Mental health";
const MENTAL_HEALTH_UR = "ذہنی صحت";
const SKIN = "Skin";
const SKIN_UR = "جلد";

export const conditionPages: ContentPage[] = [
  /* ------------------------------------------------------------------ */
  /* Mental health                                                       */
  /* ------------------------------------------------------------------ */
  {
    slug: "mental-disorders",
    title: "Mental Disorders",
    titleUr: "ذہنی امراض",
    summary:
      "What mental health and mental illness are, how common they are in Pakistan, and the conditions we treat.",
    summaryUr:
      "ذہنی صحت اور ذہنی بیماری کیا ہیں، پاکستان میں یہ کتنی عام ہیں، اور ہم کن امراض کا علاج کرتے ہیں۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "h",
        text: "What is mental health?",
        textUr: "ذہنی صحت کیا ہے؟",
      },
      {
        kind: "p",
        text: "Mental health refers to your emotional and psychological well-being. Good mental health helps you lead a relatively happy and healthy life, and helps you cope in the face of life's adversities. It can be influenced by many things, including life events and your genetics.",
        textUr:
          "ذہنی صحت سے مراد آپ کی جذباتی اور نفسیاتی تندرستی ہے۔ اچھی ذہنی صحت آپ کو نسبتاً خوش اور صحت مند زندگی گزارنے میں مدد دیتی ہے، اور زندگی کی مشکلات کا سامنا کرنے کے قابل بناتی ہے۔ اس پر بہت سی چیزیں اثر ڈال سکتی ہیں، جن میں زندگی کے واقعات اور آپ کے جینز (genetics) بھی شامل ہیں۔",
      },
      {
        kind: "ul",
        items: [
          "Keeping a positive attitude",
          "Staying physically active",
          "Helping other people",
          "Getting enough sleep",
          "Eating a healthy diet",
          "Asking for professional help when you need it",
          "Spending time with people whose company you enjoy",
          "Building coping skills that actually work for you",
        ],
        itemsUr: [
          "مثبت سوچ رکھنا",
          "جسمانی طور پر متحرک رہنا",
          "دوسروں کی مدد کرنا",
          "پوری نیند لینا",
          "صحت بخش غذا کھانا",
          "ضرورت پڑنے پر ماہر سے مدد مانگنا",
          "ایسے لوگوں کے ساتھ وقت گزارنا جن کی صحبت آپ کو اچھی لگتی ہے",
          "مشکل وقت سنبھالنے کے ایسے طریقے سیکھنا جو واقعی آپ کے لیے کارآمد ہوں",
        ],
      },
      {
        kind: "h",
        text: "What is mental illness?",
        textUr: "ذہنی بیماری کیا ہے؟",
      },
      {
        kind: "p",
        text: "Mental illness is a broad term covering a wide variety of conditions that affect the way you feel and think, and your ability to get through day-to-day life. It can be influenced by genetics, environment, daily habits and biology.",
        textUr:
          "ذہنی بیماری ایک وسیع اصطلاح ہے جس میں بہت سی مختلف کیفیات شامل ہیں — وہ کیفیات جو آپ کے محسوس کرنے اور سوچنے کے انداز پر، اور روزمرہ زندگی گزارنے کی صلاحیت پر اثر ڈالتی ہیں۔ اس پر جینز، ماحول، روزمرہ عادات اور جسم کے اپنے حیاتیاتی عوامل اثر ڈال سکتے ہیں۔",
      },
      {
        kind: "h",
        text: "How common is it?",
        textUr: "یہ کتنی عام ہے؟",
      },
      {
        kind: "p",
        text: "Mental health issues are common worldwide. In the United States, about one in five adults experiences at least one mental illness each year, and about one in five young people aged 13 to 18 experiences one at some point. The figures in Pakistan are higher still — around 34%.",
        textUr:
          "ذہنی صحت کے مسائل پوری دنیا میں عام ہیں۔ امریکہ میں ہر 5 میں سے تقریباً ایک بالغ شخص ہر سال کم از کم ایک ذہنی بیماری کا سامنا کرتا ہے، اور 13 سے 18 سال کے نوجوانوں میں سے تقریباً ہر 5 میں سے ایک کو زندگی کے کسی نہ کسی مرحلے پر یہ مسئلہ پیش آتا ہے۔ پاکستان میں یہ شرح اس سے بھی زیادہ ہے — تقریباً 34%۔",
      },
      {
        kind: "p",
        text: "Although mental illness is common, severity varies. About one in 25 adults experiences a serious mental illness in a given year, which can significantly reduce the ability to carry out daily life.",
        textUr:
          "اگرچہ ذہنی بیماری عام ہے، مگر اس کی شدت مختلف ہوتی ہے۔ ہر 25 میں سے تقریباً ایک بالغ شخص کسی ایک سال میں کسی سنگین ذہنی بیماری کا سامنا کرتا ہے، جو روزمرہ زندگی گزارنے کی صلاحیت کو نمایاں طور پر کم کر سکتی ہے۔",
      },
      {
        kind: "h",
        text: "Conditions we treat",
        textUr: "ہم کن امراض کا علاج کرتے ہیں",
      },
      {
        kind: "ul",
        items: [
          "Depression and persistent depressive disorder",
          "Bipolar disorder (manic depression)",
          "Generalized anxiety disorder, panic attacks and social anxiety",
          "Obsessive-compulsive disorder (OCD)",
          "Post-traumatic stress disorder (PTSD)",
          "Schizophrenia",
          "Attention deficit disorder — ADHD in children, ADD in adults",
          "Addiction, alcohol addiction and drug abuse",
          "Adolescent problems and early parenting issues",
          "Children's educational and developmental problems",
          "Concentration problems, emotional outbursts, tic disorders",
          "Dementias and geriatric problems",
          "General psychiatry and neurological disorders",
        ],
        itemsUr: [
          "ڈپریشن اور مسلسل رہنے والا ڈپریشن (persistent depressive disorder)",
          "دوقطبی مرض (bipolar disorder یا مینک ڈپریشن)",
          "عمومی بے چینی (generalized anxiety disorder)، گھبراہٹ کے دورے اور سماجی بے چینی",
          "وسواس (OCD)",
          "صدمے کے بعد کا ذہنی دباؤ (PTSD)",
          "شیزوفرینیا",
          "توجہ کی کمی کا مرض — بچوں میں ADHD، بڑوں میں ADD",
          "نشے کی لت، شراب نوشی اور منشیات کا استعمال",
          "نوجوانی کے مسائل اور بچوں کی ابتدائی پرورش کے مسائل",
          "بچوں کے تعلیمی اور نشوونما کے مسائل",
          "توجہ مرکوز نہ ہونا، جذبات کا بے قابو ہو جانا، اعصابی جھٹکے (tic disorders)",
          "یادداشت کی کمزوری (dementia) اور بڑھاپے کے مسائل",
          "عمومی نفسیات اور اعصابی امراض",
        ],
      },
      {
        kind: "note",
        text: "Confidential online telemedicine consultations are available, so you can speak to your doctor from the privacy of your home.",
        textUr:
          "خفیہ آن لائن ٹیلی میڈیسن مشاورت دستیاب ہے، تاکہ آپ اپنے گھر میں رہتے ہوئے، پردے کے ساتھ، اپنے ڈاکٹر سے بات کر سکیں۔",
      },
      { kind: "h", text: "Our doctors", textUr: "ہمارے ڈاکٹر" },
      {
        kind: "p",
        text: "Our doctors trained in the U.S.A. at leading hospitals and are American Board Certified — the highest degree of specialisation — with over 30 years of experience in the U.S.A. treating patients and teaching other doctors how to diagnose and treat mental disorders.",
        textUr:
          "ہمارے ڈاکٹروں نے امریکہ کے نمایاں ہسپتالوں میں تربیت حاصل کی ہے اور وہ American Board Certified ہیں — یعنی تخصص کی بلند ترین سند کے حامل — اور انہیں امریکہ میں مریضوں کے علاج اور دوسرے ڈاکٹروں کو ذہنی امراض کی تشخیص اور علاج سکھانے کا 30 سال سے زائد تجربہ ہے۔",
      },
    ],
  },
  {
    slug: "major-depressive-disorder",
    title: "Major Depressive Disorder",
    titleUr: "شدید ڈپریشن (Major Depressive Disorder)",
    summary:
      "Extreme sadness or hopelessness lasting at least two weeks — also called clinical depression.",
    summaryUr:
      "کم از کم دو ہفتے تک رہنے والی شدید اداسی یا مایوسی — جسے کلینیکل ڈپریشن بھی کہا جاتا ہے۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Major depressive disorder (MDD) causes feelings of extreme sadness or hopelessness that last for at least two weeks. It is also called clinical depression.",
        textUr:
          "شدید ڈپریشن (MDD) میں انسان کو ایسی شدید اداسی یا مایوسی محسوس ہوتی ہے جو کم از کم دو ہفتے تک رہتی ہے۔ اسے کلینیکل ڈپریشن بھی کہا جاتا ہے۔",
      },
      {
        kind: "p",
        text: "People with MDD may become so distressed about their lives that they think about suicide. The condition is common — about 8% of people in Pakistan experience at least one major depressive episode each year.",
        textUr:
          "MDD کے مریض بعض اوقات اپنی زندگی سے اس قدر پریشان ہو جاتے ہیں کہ ان کے ذہن میں خودکشی کے خیال آنے لگتے ہیں۔ یہ مرض عام ہے — پاکستان میں تقریباً 8% لوگ ہر سال کم از کم ایک بار شدید ڈپریشن کے دور سے گزرتے ہیں۔",
      },
      {
        kind: "note",
        text: "If you are having thoughts of harming yourself, please tell someone today — a doctor, a family member, or call the clinic. This is treatable, and you do not have to manage it alone.",
        textUr:
          "اگر آپ کے ذہن میں خود کو نقصان پہنچانے کے خیال آ رہے ہیں تو آج ہی کسی کو بتائیں — کسی ڈاکٹر کو، گھر کے کسی فرد کو، یا کلینک کو فون کریں۔ اس کا علاج ممکن ہے، اور آپ کو یہ سب اکیلے نہیں سنبھالنا۔",
      },
    ],
  },
  {
    slug: "persistent-depressive-disorder",
    title: "Persistent Depressive Disorder",
    titleUr: "مسلسل ڈپریشن (Persistent Depressive Disorder)",
    summary:
      "A chronic, lower-intensity depression — also known as dysthymia — lasting two years or more.",
    summaryUr:
      "کم شدت کا مگر دیرپا ڈپریشن — جسے ڈسٹھیمیا (dysthymia) بھی کہتے ہیں — جو دو سال یا اس سے زیادہ عرصے تک رہتا ہے۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Persistent depressive disorder is a chronic type of depression, also known as dysthymia. While it is not as intense as a major depressive episode, it interferes with daily life, and people with this condition experience symptoms for at least two years.",
        textUr:
          "مسلسل ڈپریشن، ڈپریشن کی ایک دیرپا قسم ہے، جسے ڈسٹھیمیا (dysthymia) بھی کہا جاتا ہے۔ اگرچہ اس کی شدت شدید ڈپریشن کے دورے جتنی نہیں ہوتی، مگر یہ روزمرہ زندگی میں رکاوٹ ضرور ڈالتا ہے، اور اس کے مریضوں میں علامات کم از کم دو سال تک رہتی ہیں۔",
      },
    ],
  },
  {
    slug: "bipolar-disorder",
    title: "Bipolar Disorder (Manic Depression)",
    titleUr: "دوقطبی مرض (Bipolar Disorder یا مینک ڈپریشن)",
    summary:
      "Episodes of energetic, manic highs and extreme lows — far beyond the ordinary ups and downs of daily life.",
    summaryUr:
      "جوش اور بے پناہ سرگرمی کے دور اور شدید پستی کے دور — جو روزمرہ زندگی کے معمولی اتار چڑھاؤ سے کہیں بڑھ کر ہوتے ہیں۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Bipolar disorder is a chronic mental illness affecting about 4% of Pakistanis each year. It is characterised by episodes of energetic, manic highs and extreme, sometimes depressive lows.",
        textUr:
          "دوقطبی مرض ایک دیرپا ذہنی بیماری ہے جو ہر سال تقریباً 4% پاکستانیوں کو متاثر کرتی ہے۔ اس کی پہچان یہ ہے کہ مریض پر کبھی جوش اور بے پناہ سرگرمی (مینیا) کے دور آتے ہیں اور کبھی شدید، اور بعض اوقات ڈپریشن والی، پستی کے دور۔",
      },
      {
        kind: "p",
        text: "These episodes affect a person's energy level and ability to think reasonably. The mood swings caused by bipolar disorder are much more severe than the small ups and downs most people experience day to day.",
        textUr:
          "یہ دور انسان کی توانائی اور سوچ سمجھ کر فیصلہ کرنے کی صلاحیت پر اثر ڈالتے ہیں۔ دوقطبی مرض میں موڈ کے یہ اتار چڑھاؤ اُن چھوٹے موٹے اتار چڑھاؤ سے کہیں زیادہ شدید ہوتے ہیں جن سے اکثر لوگ روز گزرتے ہیں۔",
      },
    ],
  },
  {
    slug: "generalized-anxiety-disorder",
    title: "Generalized Anxiety Disorder",
    titleUr: "عمومی بے چینی کا مرض (Generalized Anxiety Disorder)",
    summary:
      "Persistent, disproportionate worry about many things — even when there is little reason to worry.",
    summaryUr:
      "بہت سی باتوں کے بارے میں مسلسل اور ضرورت سے کہیں زیادہ فکر — چاہے فکر کی کوئی خاص وجہ نہ ہو۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Generalized anxiety disorder (GAD) goes beyond ordinary everyday anxiety, such as being nervous before a presentation. It causes a person to become extremely worried about many things, even when there is little or no reason to worry.",
        textUr:
          "عمومی بے چینی کا مرض (GAD) روزمرہ کی عام گھبراہٹ سے آگے کی بات ہے، جیسے کسی تقریر سے پہلے گھبرا جانا۔ اس میں انسان بہت سی باتوں کے بارے میں حد سے زیادہ پریشان رہتا ہے، چاہے فکر کرنے کی وجہ برائے نام ہو یا بالکل نہ ہو۔",
      },
      {
        kind: "p",
        text: "People with GAD may feel very nervous about simply getting through the day, and may believe things will never work in their favour. Worry can reach the point of preventing everyday tasks and chores. GAD affects about 3% of Pakistanis every year.",
        textUr:
          "GAD کے مریض کو محض دن گزارنے کا سوچ کر بھی شدید گھبراہٹ ہو سکتی ہے، اور وہ یہ سمجھنے لگتا ہے کہ کبھی کچھ اس کے حق میں نہیں ہوگا۔ فکر اتنی بڑھ سکتی ہے کہ روزمرہ کے کام اور گھر کے کام رک جائیں۔ GAD ہر سال تقریباً 3% پاکستانیوں کو متاثر کرتی ہے۔",
      },
    ],
  },
  {
    slug: "panic-disorder",
    title: "Panic Disorder",
    titleUr: "گھبراہٹ کے دوروں کا مرض (Panic Disorder)",
    summary: "Sudden, intense episodes of fear with strong physical symptoms.",
    summaryUr:
      "اچانک آنے والے شدید خوف کے دورے، جن کے ساتھ نمایاں جسمانی علامات بھی ہوتی ہیں۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Panic attacks are sudden episodes of intense fear that arrive with physical symptoms — a racing heart, shortness of breath, dizziness, or a feeling that something catastrophic is about to happen. They can occur without an obvious trigger.",
        textUr:
          "گھبراہٹ کے دورے (panic attacks) شدید خوف کے وہ اچانک لمحے ہیں جو جسمانی علامات کے ساتھ آتے ہیں — دل کا تیز دھڑکنا، سانس پھولنا، چکر آنا، یا یہ احساس کہ کوئی بہت بڑی آفت آنے ہی والی ہے۔ یہ بغیر کسی ظاہری وجہ کے بھی ہو سکتے ہیں۔",
      },
      {
        kind: "p",
        text: "Panic disorder is treatable. Because the physical symptoms are so strong, many people first seek help believing the problem is with their heart or their breathing, which is one reason a proper evaluation matters.",
        textUr:
          "گھبراہٹ کے دوروں کے مرض کا علاج موجود ہے۔ چونکہ جسمانی علامات بہت شدید ہوتی ہیں، اس لیے بہت سے لوگ پہلے یہ سمجھ کر مدد لینے جاتے ہیں کہ مسئلہ دل کا ہے یا سانس کا — یہی ایک وجہ ہے کہ صحیح طریقے سے جانچ ضروری ہے۔",
      },
    ],
  },
  {
    slug: "obsessive-compulsive-disorder",
    title: "Obsessive-Compulsive Disorder",
    titleUr: "وسواس (Obsessive-Compulsive Disorder)",
    summary:
      "Repetitive, intrusive thoughts paired with compulsions that are difficult to resist.",
    summaryUr:
      "بار بار آنے والے بے قابو خیالات، اور ان کے ساتھ ایسے کام جن سے رکنا مشکل ہوتا ہے۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Obsessive-compulsive disorder (OCD) causes constant, repetitive thoughts — obsessions. These occur alongside unnecessary and unreasonable urges to carry out certain behaviours, or compulsions.",
        textUr:
          "وسواس (OCD) میں مسلسل، بار بار لوٹ کر آنے والے خیال پیدا ہوتے ہیں — جنہیں obsessions کہتے ہیں۔ ان کے ساتھ ساتھ بعض کام بار بار کرنے کی غیر ضروری اور بے جا خواہش بھی ہوتی ہے، جسے compulsions کہا جاتا ہے۔",
      },
      {
        kind: "p",
        text: "Many people with OCD recognise that their thoughts and actions are unreasonable, and still cannot stop them. That gap between knowing and being able to stop is the condition, not a failure of will.",
        textUr:
          "OCD کے بہت سے مریض خود جانتے ہیں کہ ان کے خیالات اور کام بے جا ہیں، پھر بھی وہ انہیں روک نہیں پاتے۔ جان لینے اور رک سکنے کے درمیان کا یہی فاصلہ اصل بیماری ہے، ارادے کی کمزوری نہیں۔",
      },
    ],
  },
  {
    slug: "post-traumatic-stress-disorder",
    title: "Post-Traumatic Stress Disorder",
    titleUr: "صدمے کے بعد کا ذہنی دباؤ (PTSD)",
    summary:
      "A response triggered after experiencing or witnessing a traumatic event.",
    summaryUr:
      "کوئی تکلیف دہ واقعہ خود بیتنے یا اپنی آنکھوں سے دیکھنے کے بعد پیدا ہونے والا ردِعمل۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Post-traumatic stress disorder (PTSD) is triggered after experiencing or witnessing a traumatic event. The experiences that can cause it range widely — from war and natural disasters to verbal or physical abuse.",
        textUr:
          "صدمے کے بعد کا ذہنی دباؤ (PTSD) کسی تکلیف دہ واقعے سے گزرنے یا اسے اپنی آنکھوں سے دیکھنے کے بعد پیدا ہوتا ہے۔ جن تجربات سے یہ ہو سکتا ہے ان کا دائرہ بہت وسیع ہے — جنگ اور قدرتی آفات سے لے کر زبانی یا جسمانی تشدد تک۔",
      },
      {
        kind: "p",
        text: "Symptoms may include flashbacks, or being easily startled.",
        textUr:
          "علامات میں ماضی کے مناظر کا بار بار آنکھوں کے سامنے آ جانا (flashbacks)، یا ذرا سی بات پر چونک اٹھنا شامل ہو سکتا ہے۔",
      },
    ],
  },
  {
    slug: "schizophrenia",
    title: "Schizophrenia",
    titleUr: "شیزوفرینیا",
    summary:
      "A serious condition affecting perception of reality, and connection to other people.",
    summaryUr:
      "ایک سنگین بیماری جو حقیقت کو سمجھنے کی صلاحیت اور دوسرے لوگوں سے تعلق پر اثر ڈالتی ہے۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Schizophrenia impairs a person's perception of reality and of the world around them, and interferes with their connection to other people. It is a serious condition that needs treatment.",
        textUr:
          "شیزوفرینیا انسان کی حقیقت کو اور اپنے گرد و پیش کو سمجھنے کی صلاحیت کو خراب کر دیتی ہے، اور دوسرے لوگوں سے اس کے تعلق میں رکاوٹ ڈالتی ہے۔ یہ ایک سنگین بیماری ہے جس کا علاج ضروری ہے۔",
      },
      {
        kind: "p",
        text: "People may experience hallucinations, hold delusions, or hear voices. Left untreated, these can put them in danger — which is why early treatment matters so much.",
        textUr:
          "مریض کو ایسی چیزیں دکھائی یا محسوس ہو سکتی ہیں جو موجود نہیں ہوتیں، وہ بے بنیاد باتوں کو سچ سمجھ سکتا ہے، یا آوازیں سن سکتا ہے۔ علاج نہ ہو تو یہ کیفیات اسے خطرے میں ڈال سکتی ہیں — اسی لیے جلد علاج شروع کرنا بہت اہم ہے۔",
      },
    ],
  },
  {
    slug: "social-anxiety-disorder",
    title: "Social Anxiety Disorder",
    titleUr: "سماجی بے چینی کا مرض (Social Anxiety Disorder)",
    summary: "An extreme fear of social situations, sometimes called social phobia.",
    summaryUr:
      "لوگوں میں اٹھنے بیٹھنے کا شدید خوف، جسے کبھی سوشل فوبیا بھی کہا جاتا ہے۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Social anxiety disorder, sometimes called social phobia, causes an extreme fear of social situations. People with social anxiety may become very nervous about being around others, and may feel they are being judged.",
        textUr:
          "سماجی بے چینی کا مرض، جسے کبھی سوشل فوبیا (social phobia) بھی کہا جاتا ہے، لوگوں میں اٹھنے بیٹھنے کا شدید خوف پیدا کرتا ہے۔ ایسے لوگ دوسروں کے درمیان ہوتے ہوئے بہت گھبراہٹ محسوس کر سکتے ہیں، اور انہیں لگ سکتا ہے کہ لوگ ان کو پرکھ رہے ہیں۔",
      },
      {
        kind: "p",
        text: "This makes it hard to meet new people or attend social gatherings. Approximately 15 million adults in Pakistan experience social anxiety each year.",
        textUr:
          "اس کی وجہ سے نئے لوگوں سے ملنا یا کسی تقریب میں جانا مشکل ہو جاتا ہے۔ پاکستان میں تقریباً 15 ملین بالغ افراد ہر سال سماجی بے چینی کا سامنا کرتے ہیں۔",
      },
    ],
  },
  {
    slug: "mental-disorder-symptoms",
    title: "Mental Disorder Symptoms",
    titleUr: "ذہنی امراض کی علامات",
    summary:
      "Signs that are common across several mental illnesses, and when to reach out.",
    summaryUr:
      "وہ علامات جو کئی ذہنی بیماریوں میں مشترک ہیں، اور کب رابطہ کرنا چاہیے۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Each type of mental illness causes its own symptoms, but many share common characteristics. Common signs include:",
        textUr:
          "ہر ذہنی بیماری کی اپنی علامات ہوتی ہیں، مگر بہت سی علامات ان میں مشترک بھی ہیں۔ عام علامات میں یہ شامل ہیں:",
      },
      {
        kind: "ul",
        items: [
          "Not eating enough, or overeating",
          "Insomnia, or sleeping too much",
          "Distancing yourself from other people and from activities you used to enjoy",
          "Fatigue even after enough sleep",
          "Feeling numb, or lacking empathy",
          "Unexplained body pains or aches",
          "Feeling hopeless, helpless or lost",
          "Smoking, drinking or using drugs more than before",
          "Confusion, forgetfulness, irritability, anger, anxiety, sadness or fright",
          "Constantly fighting or arguing with friends and family",
          "Extreme mood swings that cause relationship problems",
          "Constant flashbacks, or thoughts you cannot get out of your head",
          "Hearing voices you cannot stop",
          "Thoughts of hurting yourself or others",
          "Being unable to carry out day-to-day activities",
        ],
        itemsUr: [
          "بہت کم کھانا، یا حد سے زیادہ کھانا",
          "نیند نہ آنا، یا بہت زیادہ سونا",
          "لوگوں سے اور اُن کاموں سے کترانا جو پہلے اچھے لگتے تھے",
          "پوری نیند کے بعد بھی تھکن محسوس ہونا",
          "کچھ محسوس ہی نہ ہونا، یا دوسروں کے دکھ کا احساس نہ ہونا",
          "جسم میں بغیر کسی وجہ کے درد یا تکلیف",
          "مایوسی، بے بسی یا بھٹک جانے کا احساس",
          "پہلے سے زیادہ سگریٹ، شراب یا نشہ استعمال کرنا",
          "الجھن، بھول جانا، چڑچڑاپن، غصہ، بے چینی، اداسی یا خوف",
          "دوستوں اور گھر والوں سے آئے دن لڑائی یا بحث",
          "موڈ کا اس قدر بدلنا کہ رشتوں میں مسائل پیدا ہو جائیں",
          "ماضی کے مناظر کا بار بار سامنے آنا، یا ایسے خیال جو ذہن سے نکلتے ہی نہیں",
          "ایسی آوازیں سنائی دینا جنہیں آپ روک نہیں سکتے",
          "خود کو یا دوسروں کو نقصان پہنچانے کے خیال",
          "روزمرہ کے کام نہ کر پانا",
        ],
      },
      {
        kind: "p",
        text: "Stress and periods of emotional distress can bring on an episode of symptoms, making it difficult to maintain normal behaviour and activities. This is sometimes called a nervous or mental breakdown.",
        textUr:
          "ذہنی دباؤ اور جذباتی پریشانی کے دور علامات کا ایک پورا دورہ لا سکتے ہیں، جس میں معمول کا رویّہ اور معمول کے کام جاری رکھنا مشکل ہو جاتا ہے۔ اسے بعض اوقات اعصابی یا ذہنی بریک ڈاؤن کہا جاتا ہے۔",
      },
      {
        kind: "note",
        text: "These symptoms often get worse if they are left alone. If you recognise several of them in yourself or someone close to you, that is reason enough to book a consultation.",
        textUr:
          "یہ علامات اکثر نظرانداز کرنے سے بڑھ جاتی ہیں۔ اگر ان میں سے کئی علامات آپ کو اپنے اندر یا کسی قریبی شخص میں نظر آ رہی ہیں، تو یہی وجہ کافی ہے کہ مشورے کے لیے وقت لے لیا جائے۔",
      },
    ],
  },
  {
    slug: "diagnosis-and-treatment",
    title: "Diagnosis and Treatment",
    titleUr: "تشخیص اور علاج",
    summary: "How a mental health diagnosis is actually reached, step by step.",
    summaryUr:
      "ذہنی صحت کی تشخیص عملی طور پر کیسے کی جاتی ہے، ایک ایک مرحلہ۔",
    group: "conditions",
    section: MENTAL_HEALTH,
    sectionUr: MENTAL_HEALTH_UR,
    blocks: [
      {
        kind: "p",
        text: "Diagnosing a mental health disorder is a multi-step process. At a first appointment, your doctor may perform a physical examination to look for signs of physical issues that could be contributing to your symptoms, and may order laboratory tests to screen for less obvious causes.",
        textUr:
          "ذہنی بیماری کی تشخیص کئی مرحلوں کا عمل ہے۔ پہلی ملاقات میں آپ کے ڈاکٹر جسمانی معائنہ کر سکتے ہیں تاکہ ایسی جسمانی خرابیوں کی نشانیاں دیکھی جا سکیں جو آپ کی علامات کا سبب بن رہی ہوں، اور کم واضح وجوہات جاننے کے لیے لیبارٹری ٹیسٹ بھی لکھ سکتے ہیں۔",
      },
      {
        kind: "p",
        text: "You may be asked to complete a mental health questionnaire, and may undergo a psychological evaluation. You might not have a diagnosis after the first appointment.",
        textUr:
          "آپ سے ذہنی صحت کا ایک سوالنامہ بھروایا جا سکتا ہے، اور نفسیاتی جانچ بھی ہو سکتی ہے۔ یہ بھی ممکن ہے کہ پہلی ملاقات کے بعد تشخیص نہ ہو پائے۔",
      },
      {
        kind: "p",
        text: "Because mental health is complex and symptoms vary from person to person, it can take a few appointments to reach a full diagnosis. A first appointment here is deliberately longer, so your history and background can be gone through properly before any medication is started.",
        textUr:
          "چونکہ ذہنی صحت ایک پیچیدہ معاملہ ہے اور علامات ہر شخص میں مختلف ہوتی ہیں، اس لیے مکمل تشخیص تک پہنچنے میں چند ملاقاتیں لگ سکتی ہیں۔ یہاں پہلی ملاقات جان بوجھ کر لمبی رکھی جاتی ہے، تاکہ کوئی بھی دوا شروع کرنے سے پہلے آپ کی پوری تاریخ اور پس منظر اطمینان سے دیکھا جا سکے۔",
      },
      {
        kind: "p",
        text: "It is worth saying plainly: you can have a full and happy life with a mental illness. Working with your doctor is how you learn healthy ways to manage the condition.",
        textUr:
          "یہ بات صاف کہنے کی ہے: ذہنی بیماری کے باوجود آپ بھرپور اور خوشگوار زندگی گزار سکتے ہیں۔ اپنے ڈاکٹر کے ساتھ مل کر چلنے سے ہی آپ اس بیماری کو سنبھالنے کے صحت مند طریقے سیکھتے ہیں۔",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Skin                                                                */
  /* ------------------------------------------------------------------ */
  {
    slug: "acne-scars",
    title: "Acne Scars",
    titleUr: "کیل مہاسوں کے نشان",
    summary:
      "Why acne scars form, and the treatments we offer to make them less noticeable.",
    summaryUr:
      "کیل مہاسوں کے نشان کیوں بنتے ہیں، اور انہیں کم نمایاں کرنے کے لیے ہم کون سے علاج پیش کرتے ہیں۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      { kind: "h", text: "Overview", textUr: "تعارف" },
      {
        kind: "p",
        text: "Acne is a skin condition that occurs when hair follicles become plugged with oil and dead skin cells. It often causes whiteheads, blackheads or pimples, usually on the face, forehead, chest, upper back and shoulders. It is most common among teenagers, though it affects people of all ages.",
        textUr:
          "ایکنی (کیل مہاسے) جلد کی وہ کیفیت ہے جو اُس وقت پیدا ہوتی ہے جب بالوں کی جڑیں تیل اور جلد کے مردہ خلیوں سے بند ہو جاتی ہیں۔ اس سے اکثر وائٹ ہیڈز، بلیک ہیڈز یا دانے بنتے ہیں، عموماً چہرے، پیشانی، سینے، اوپری کمر اور کندھوں پر۔ یہ نوجوانوں میں سب سے زیادہ عام ہے، اگرچہ ہر عمر کے لوگ اس سے متاثر ہوتے ہیں۔",
      },
      {
        kind: "p",
        text: "Effective treatments exist, but acne can be persistent. Pimples and bumps heal slowly, and as one begins to fade others appear. Depending on severity, acne can cause emotional distress and scar the skin. The earlier treatment starts, the lower the risk of both.",
        textUr:
          "مؤثر علاج موجود ہیں، مگر ایکنی ضدی ثابت ہو سکتی ہے۔ دانے اور ابھار آہستہ ٹھیک ہوتے ہیں، اور ایک ہلکا پڑنا شروع ہوتا ہے تو دوسرے نکل آتے ہیں۔ شدت کے لحاظ سے ایکنی ذہنی پریشانی کا سبب بن سکتی ہے اور جلد پر نشان بھی چھوڑ سکتی ہے۔ علاج جتنا جلد شروع ہو، ان دونوں کا خطرہ اتنا ہی کم رہتا ہے۔",
      },
      {
        kind: "h",
        text: "Treatments we offer for acne scars",
        textUr: "کیل مہاسوں کے نشانوں کے لیے ہمارے علاج",
      },
      {
        kind: "p",
        text: "Acne scars are stubborn, and no single treatment is best for everyone. Your doctor may suggest one of these, or a combination.",
        textUr:
          "کیل مہاسوں کے نشان ضدی ہوتے ہیں، اور کوئی ایک علاج ہر شخص کے لیے بہترین نہیں ہوتا۔ آپ کے ڈاکٹر ان میں سے کوئی ایک علاج تجویز کر سکتے ہیں، یا ایک سے زیادہ کا امتزاج۔",
      },
      {
        kind: "ul",
        items: [
          "**Micro-needling with PRP.** A needle-studded device is rolled over the skin to stimulate the underlying tissue, with platelet-rich plasma drawn from your own blood. Safe and simple; results build over repeated treatments.",
          "**Soft tissue fillers.** Injecting filler under indented scars fills out or stretches the skin, making scars less noticeable. Results are temporary, so injections are repeated periodically.",
          "**Botox injections.** Where the skin around acne scars puckers, relaxing the area with botulinum toxin improves the appearance. Repeated periodically.",
        ],
        itemsUr: [
          "**PRP کے ساتھ مائیکرو نیڈلنگ۔** باریک سوئیوں والا آلہ جلد پر پھیرا جاتا ہے تاکہ نیچے کی بافتوں میں حرکت پیدا ہو، اور ساتھ آپ ہی کے خون سے حاصل کیا گیا پلیٹلیٹ سے بھرپور پلازما (PRP) استعمال ہوتا ہے۔ یہ محفوظ اور سادہ طریقہ ہے؛ نتائج بار بار کے سیشنز سے بنتے ہیں۔",
          "**سافٹ ٹشو فلرز۔** دھنسے ہوئے نشانوں کے نیچے فلر لگانے سے جلد بھر جاتی ہے یا تن جاتی ہے، جس سے نشان کم نمایاں ہو جاتے ہیں۔ نتائج عارضی ہوتے ہیں، اس لیے انجیکشن وقتاً فوقتاً دہرانے پڑتے ہیں۔",
          "**بوٹاکس کے انجیکشن۔** جہاں نشانوں کے گرد جلد سکڑ کر سلوٹ ڈالتی ہے، وہاں بوٹولینم ٹاکسن سے اُس حصے کو ڈھیلا کرنے سے ظاہری حالت بہتر ہو جاتی ہے۔ یہ بھی وقتاً فوقتاً دہرایا جاتا ہے۔",
        ],
      },
    ],
  },
  {
    slug: "hair-thinning-hair-loss",
    title: "Hair Thinning & Hair Loss",
    titleUr: "بالوں کا پتلا ہونا اور گرنا",
    summary:
      "The causes and patterns of hair loss, how it is diagnosed, and PRP treatment for regrowth.",
    summaryUr:
      "بال گرنے کی وجوہات اور اس کے انداز، تشخیص کیسے ہوتی ہے، اور بال دوبارہ اُگانے کے لیے PRP کا علاج۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      { kind: "h", text: "Overview", textUr: "تعارف" },
      {
        kind: "p",
        text: "Hair loss can affect just your scalp or your entire body. It can result from heredity, hormonal changes, medical conditions or medications. Anyone can experience it, though it is more common in men. Many good treatments exist to prevent further loss and to restore growth.",
        textUr:
          "بالوں کا گرنا صرف سر تک محدود ہو سکتا ہے یا پورے جسم کو متاثر کر سکتا ہے۔ اس کی وجہ خاندانی ورثہ، ہارمونز کی تبدیلیاں، کوئی بیماری یا دوائیں ہو سکتی ہیں۔ یہ کسی کو بھی ہو سکتا ہے، اگرچہ مردوں میں زیادہ عام ہے۔ مزید بال گرنے سے روکنے اور دوبارہ اُگانے کے لیے کئی اچھے علاج موجود ہیں۔",
      },
      { kind: "h", text: "Signs and symptoms", textUr: "نشانیاں اور علامات" },
      {
        kind: "ul",
        items: [
          "**Gradual thinning on top of the head.** The most common type. In men the hair often recedes from the forehead in an M-shaped line; women typically keep the hairline but the part broadens.",
          "**Circular or patchy bald spots.** Smooth, coin-sized patches, usually on the scalp but sometimes in beards or eyebrows. The skin may itch or feel painful before the hair falls out.",
          "**Sudden loosening of hair.** A physical or emotional shock can loosen hair; handfuls may come out when combing or washing. This usually causes overall thinning rather than bald patches.",
          "**Full-body hair loss.** Some conditions and treatments, such as chemotherapy, cause loss of hair all over the body. It usually grows back.",
          "**Patches of scaling that spread over the scalp.** A sign of ringworm, sometimes with broken hair, redness, swelling and oozing.",
        ],
        itemsUr: [
          "**سر کے اوپری حصے سے بالوں کا آہستہ آہستہ کم ہونا۔** سب سے عام قسم۔ مردوں میں بال اکثر پیشانی سے پیچھے ہٹتے ہیں اور M کی شکل کی لکیر بن جاتی ہے؛ عورتوں میں عموماً بالوں کی اگلی لکیر برقرار رہتی ہے مگر مانگ چوڑی ہوتی جاتی ہے۔",
          "**گول یا ٹکڑوں کی شکل میں گنج کے دھبے۔** سکے کے برابر چکنے دھبے، عموماً سر پر، مگر کبھی داڑھی یا بھنوؤں میں بھی۔ بال گرنے سے پہلے جلد میں خارش یا درد محسوس ہو سکتا ہے۔",
          "**بالوں کا اچانک ڈھیلا ہو جانا۔** کوئی جسمانی یا جذباتی صدمہ بالوں کو ڈھیلا کر سکتا ہے؛ کنگھی کرتے یا سر دھوتے وقت مٹھی بھر بال آ سکتے ہیں۔ اس سے عموماً گنج کے دھبے نہیں بنتے بلکہ مجموعی طور پر بال پتلے ہو جاتے ہیں۔",
          "**پورے جسم کے بالوں کا گرنا۔** کچھ بیماریاں اور علاج، جیسے کیموتھراپی، پورے جسم کے بال گرا دیتے ہیں۔ عموماً یہ بال دوبارہ اُگ آتے ہیں۔",
          "**سر پر پھیلتے ہوئے کھرنڈ کے دھبے۔** یہ داد (ringworm) کی نشانی ہے، بعض اوقات ساتھ بال ٹوٹتے ہیں اور سرخی، سوجن اور رساؤ بھی ہوتا ہے۔",
        ],
      },
      { kind: "h", text: "Causes", textUr: "وجوہات" },
      {
        kind: "p",
        text: "People typically lose about 100 hairs a day without noticeable thinning, because new hair grows in at the same time. Hair loss occurs when that cycle is disrupted, or when the follicle is destroyed and replaced with scar tissue.",
        textUr:
          "عام طور پر روزانہ تقریباً 100 بال گرتے ہیں اور بال کم ہوتے محسوس نہیں ہوتے، کیونکہ ساتھ ساتھ نئے بال اُگتے بھی رہتے ہیں۔ بال گرنے کا مسئلہ اُس وقت ہوتا ہے جب یہ چکر بگڑ جائے، یا بال کی جڑ ختم ہو کر اس کی جگہ نشان والی بافت بن جائے۔",
      },
      {
        kind: "ul",
        items: [
          "**Family history.** The most common cause — male-pattern or female-pattern baldness, occurring gradually with age in predictable patterns.",
          "**Hormonal changes and medical conditions.** Pregnancy, childbirth, menopause and thyroid problems; alopecia areata; scalp infections such as ringworm; and trichotillomania, a hair-pulling disorder.",
          "**Medications and supplements.** Including drugs used for cancer, arthritis, depression, heart problems, gout and high blood pressure.",
          "**Radiation therapy to the head.** Hair may not grow back the same as before.",
          "**A very stressful event.** General thinning several months after a physical or emotional shock. This type is temporary.",
          "**Certain hairstyles and treatments.** Styles that pull the hair tight can cause traction alopecia; hot oil treatments and perms can inflame follicles. If scarring occurs, the loss may be permanent.",
        ],
        itemsUr: [
          "**خاندانی ورثہ۔** سب سے عام وجہ — مردانہ یا زنانہ طرز کا گنج پن، جو عمر کے ساتھ آہستہ آہستہ ایک جانے پہچانے انداز میں بڑھتا ہے۔",
          "**ہارمونز کی تبدیلیاں اور بیماریاں۔** حمل، بچے کی پیدائش، سنِ یاس (menopause) اور تھائیرائیڈ کے مسائل؛ ایلوپیشیا ایریاٹا (alopecia areata)؛ سر کی جلد کے انفیکشن جیسے داد؛ اور ٹرائیکوٹیلومینیا (trichotillomania)، یعنی بال نوچنے کی بیماری۔",
          "**دوائیں اور سپلیمنٹس۔** جن میں کینسر، جوڑوں کے درد، ڈپریشن، دل کے امراض، گاؤٹ اور بلند فشارِ خون کے لیے استعمال ہونے والی دوائیں شامل ہیں۔",
          "**سر پر ریڈی ایشن تھراپی۔** ممکن ہے بال پہلے جیسے واپس نہ اُگیں۔",
          "**کوئی بہت بڑے ذہنی دباؤ کا واقعہ۔** کسی جسمانی یا جذباتی صدمے کے کئی مہینے بعد بال مجموعی طور پر پتلے ہو جاتے ہیں۔ یہ قسم عارضی ہوتی ہے۔",
          "**بالوں کے کچھ اسٹائل اور ٹریٹمنٹ۔** بالوں کو کس کر باندھنے والے اسٹائل ٹریکشن ایلوپیشیا (traction alopecia) کا سبب بن سکتے ہیں؛ گرم تیل کے ٹریٹمنٹ اور پرم بالوں کی جڑوں میں سوزش پیدا کر سکتے ہیں۔ اگر نشان بن جائیں تو بالوں کا گرنا مستقل بھی ہو سکتا ہے۔",
        ],
      },
      { kind: "h", text: "Diagnosis", textUr: "تشخیص" },
      {
        kind: "ul",
        items: [
          "**Blood test,** to uncover medical conditions related to hair loss.",
          "**Pull test.** Your doctor gently pulls several dozen hairs to see how many come out, which helps determine the stage of shedding.",
          "Other tests as indicated.",
        ],
        itemsUr: [
          "**خون کا ٹیسٹ،** تاکہ بال گرنے سے جڑی بیماریوں کا پتہ چل سکے۔",
          "**پُل ٹیسٹ۔** ڈاکٹر نرمی سے چند درجن بال کھینچ کر دیکھتے ہیں کہ کتنے نکلتے ہیں، جس سے یہ اندازہ ہوتا ہے کہ بال گرنے کا عمل کس مرحلے میں ہے۔",
          "ضرورت کے مطابق دیگر ٹیسٹ۔",
        ],
      },
      { kind: "h", text: "Treatment", textUr: "علاج" },
      {
        kind: "p",
        text: "We offer platelet-rich plasma (PRP) injection therapy for hair thinning and hair loss. Your blood is drawn and processed to extract growth-factor-rich plasma, which is injected into the scalp. Those platelets prompt inactive or newly implanted hair to enter active growth.",
        textUr:
          "ہم بالوں کے پتلے ہونے اور گرنے کے لیے پلیٹلیٹ سے بھرپور پلازما (PRP) کے انجیکشن کا علاج پیش کرتے ہیں۔ آپ کا خون نکال کر اسے اس طرح تیار کیا جاتا ہے کہ نشوونما کے اجزا سے بھرپور پلازما الگ ہو جائے، اور پھر یہ سر کی جلد میں لگایا جاتا ہے۔ یہ پلیٹلیٹس سست پڑے ہوئے یا نئے لگائے گئے بالوں کو بڑھوتری کے فعال مرحلے میں لے آتے ہیں۔",
      },
    ],
  },
  {
    slug: "crows-feet",
    title: "Crow's Feet",
    titleUr: "آنکھوں کے کناروں کی لکیریں (Crow's Feet)",
    summary:
      "The fine lines that spread from the corners of the eyes — why they form, and how they are treated.",
    summaryUr:
      "آنکھوں کے کونوں سے پھیلتی ہوئی باریک لکیریں — یہ کیوں بنتی ہیں، اور ان کا علاج کیسے ہوتا ہے۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      { kind: "h", text: "Overview", textUr: "تعارف" },
      {
        kind: "p",
        text: "As you age, some parts of the face show it before others — the delicate area around the eyes especially. Crow's feet are the small lines spreading out from the corners of the eyes. They develop over time because of the tiny muscle contractions that happen every time you make a facial expression.",
        textUr:
          "عمر بڑھنے کے ساتھ چہرے کے کچھ حصوں پر اس کا اثر دوسروں سے پہلے نظر آتا ہے — خاص طور پر آنکھوں کے گرد کے نازک حصے پر۔ crow's feet وہ چھوٹی لکیریں ہیں جو آنکھوں کے کونوں سے باہر کی طرف پھیلتی ہیں۔ یہ وقت کے ساتھ اُن باریک پٹھوں کے سکڑنے سے بنتی ہیں جو ہر بار چہرے پر کوئی تاثر بناتے وقت حرکت کرتے ہیں۔",
      },
      {
        kind: "p",
        text: "There are two kinds of wrinkle. **Dynamic** wrinkles appear during muscle contraction — if your crow's feet are mainly visible when you smile, they are probably dynamic. **Static** wrinkles may worsen with contraction but are visible all the time, even at rest. Either way there are treatment options, and in some people the signs can be reversed, at least temporarily.",
        textUr:
          "جھریوں کی دو قسمیں ہیں۔ **متحرک (dynamic)** جھریاں پٹھوں کے سکڑنے کے وقت نمودار ہوتی ہیں — اگر آپ کی یہ لکیریں زیادہ تر مسکراتے وقت نظر آتی ہیں تو غالباً وہ متحرک قسم کی ہیں۔ **ساکن (static)** جھریاں پٹھوں کے سکڑنے سے مزید گہری تو ہو سکتی ہیں مگر وہ ہر وقت نظر آتی ہیں، آرام کی حالت میں بھی۔ دونوں صورتوں میں علاج کے راستے موجود ہیں، اور کچھ لوگوں میں یہ نشانیاں کم از کم کچھ عرصے کے لیے پلٹائی جا سکتی ہیں۔",
      },
      { kind: "h", text: "Treatment", textUr: "علاج" },
      {
        kind: "p",
        text: "What you choose depends on the severity and on the result you want; sometimes a combination works best. We offer botulinum toxin (Botox) and dermal fillers.",
        textUr:
          "آپ کون سا علاج چنتے ہیں، اس کا انحصار شدت پر اور اُس نتیجے پر ہے جو آپ چاہتے ہیں؛ کبھی ایک سے زیادہ علاج ملا کر بہترین نتیجہ دیتے ہیں۔ ہم بوٹولینم ٹاکسن (Botox) اور ڈرمل فلرز پیش کرتے ہیں۔",
      },
      { kind: "h", text: "Prevention", textUr: "بچاؤ" },
      {
        kind: "ul",
        items: [
          "Limit sun exposure, and wear SPF 30 or higher even for short periods.",
          "Wear sunscreen daily — a moisturiser or foundation with SPF 15+ counts.",
          "Eat well. Fresh fruit, vegetables, whole grains and healthy oils protect skin from free-radical damage.",
          "Exercise. Daily movement brings oxygen to the skin.",
          "Wear polarised sunglasses, and a hat.",
          "Quit smoking — it produces free radicals, which makes wrinkles appear sooner.",
          "Use moisturisers and eye creams with collagen and antioxidants such as vitamin C.",
        ],
        itemsUr: [
          "دھوپ میں کم رہیں، اور تھوڑی دیر کے لیے نکلیں تب بھی SPF 30 یا اس سے زیادہ والی سن اسکرین لگائیں۔",
          "روزانہ سن اسکرین لگائیں — SPF 15 یا اس سے زیادہ والا موئسچرائزر یا فاؤنڈیشن بھی شمار ہوتا ہے۔",
          "اچھا کھائیں۔ تازہ پھل، سبزیاں، ثابت اناج اور صحت بخش تیل جلد کو فری ریڈیکلز کے نقصان سے بچاتے ہیں۔",
          "ورزش کریں۔ روزانہ کی حرکت جلد تک آکسیجن پہنچاتی ہے۔",
          "پولرائزڈ دھوپ کا چشمہ اور ٹوپی یا ہیٹ پہنیں۔",
          "سگریٹ چھوڑ دیں — اس سے فری ریڈیکلز بنتے ہیں، جن کی وجہ سے جھریاں وقت سے پہلے آ جاتی ہیں۔",
          "ایسے موئسچرائزر اور آئی کریم استعمال کریں جن میں کولاجن اور اینٹی آکسیڈنٹ ہوں، جیسے وٹامن C۔",
        ],
      },
    ],
  },
  {
    slug: "glabellar-lines",
    title: "Glabellar Lines",
    titleUr: "بھنوؤں کے اوپر کی لکیریں (Glabellar Lines)",
    summary:
      "Forehead furrows between the eyebrows — how they differ from frown lines, and how they are treated.",
    summaryUr:
      "بھنوؤں کے درمیان پیشانی کی شکنیں — یہ فرَون لائنز سے کس طرح مختلف ہیں، اور ان کا علاج کیا ہے۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      {
        kind: "p",
        text: "Your glabella is the skin on your forehead, between your eyebrows and above your nose. When you make facial expressions, that skin is moved by the muscles beneath it. Depending on your face shape, skin tightness, genetics and how often you make certain expressions, wavy lines develop there — glabellar lines, or forehead furrows.",
        textUr:
          "گلیبیلا (glabella) آپ کی پیشانی کی وہ جلد ہے جو بھنوؤں کے درمیان اور ناک کے اوپر ہوتی ہے۔ جب آپ چہرے پر کوئی تاثر بناتے ہیں تو نیچے موجود پٹھے اس جلد کو حرکت دیتے ہیں۔ آپ کے چہرے کی ساخت، جلد کی کساوٹ، خاندانی ورثے، اور اس بات کے لحاظ سے کہ آپ کتنی بار کچھ خاص تاثرات بناتے ہیں، وہاں لہریا لکیریں بن جاتی ہیں — یہی گلیبیلر لکیریں یا پیشانی کی شکنیں ہیں۔",
      },
      {
        kind: "h",
        text: "Glabellar lines vs frown lines",
        textUr: "گلیبیلر لکیریں اور فرَون لائنز میں فرق",
      },
      {
        kind: "p",
        text: "Typically, frown lines are the vertical lines between the eyes, while glabellar lines appear above the eyebrows and run horizontally. Frown lines don't only come from frowning — smiling, laughing, or looking worried or surprised all tug at the skin over those muscles.",
        textUr:
          "عام طور پر فرَون لائنز (frown lines) وہ عمودی لکیریں ہوتی ہیں جو آنکھوں کے درمیان بنتی ہیں، جبکہ گلیبیلر لکیریں بھنوؤں کے اوپر اور افقی رخ میں نمودار ہوتی ہیں۔ فرَون لائنز صرف تیوری چڑھانے سے نہیں بنتیں — مسکرانا، ہنسنا، یا پریشان یا حیران نظر آنا، یہ سب بھی اُن پٹھوں کے اوپر کی جلد کو کھینچتے ہیں۔",
      },
      { kind: "h", text: "Treatment", textUr: "علاج" },
      {
        kind: "p",
        text: "**Botox and other neuromodulators** relax the muscles under the skin, making the wrinkles less noticeable. Compared with other procedures it is affordable, and the risk of side effects is small.",
        textUr:
          "**بوٹاکس اور دوسرے نیوروماڈولیٹرز** جلد کے نیچے کے پٹھوں کو ڈھیلا کر دیتے ہیں، جس سے جھریاں کم نمایاں ہو جاتی ہیں۔ دوسرے طریقوں کے مقابلے میں یہ کم خرچ ہے، اور مضر اثرات کا خطرہ بھی کم ہے۔",
      },
      {
        kind: "p",
        text: "**Soft tissue fillers** mimic the collagen and other structural components of your skin. Both approaches carry a low risk of complications; your doctor will discuss which suits your skin.",
        textUr:
          "**سافٹ ٹشو فلرز** آپ کی جلد کے کولاجن اور دیگر ساختی اجزا جیسا کام کرتے ہیں۔ دونوں طریقوں میں پیچیدگی کا خطرہ کم ہے؛ آپ کے ڈاکٹر آپ سے بات کریں گے کہ آپ کی جلد کے لیے کون سا مناسب ہے۔",
      },
    ],
  },
  {
    slug: "marionette-lines",
    title: "Marionette Lines",
    titleUr: "ٹھوڑی کے دونوں طرف کی لکیریں (Marionette Lines)",
    summary: "The vertical lines that frame the chin as the cheeks droop.",
    summaryUr:
      "وہ عمودی لکیریں جو گالوں کے ڈھلکنے کے ساتھ ٹھوڑی کے دونوں طرف بن جاتی ہیں۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      {
        kind: "p",
        text: "Marionette lines frame the chin vertically, and as the cheeks droop, jowl wrinkles form alongside them. Depending on your face shape, skin tightness, genetics and how often you make certain expressions, you may notice these vertical lines developing at the chin.",
        textUr:
          "میریونیٹ لکیریں ٹھوڑی کے دونوں طرف عمودی رخ میں بنتی ہیں، اور جیسے جیسے گال ڈھلکتے ہیں، ان کے ساتھ جبڑے کی جھریاں بھی بن جاتی ہیں۔ آپ کے چہرے کی ساخت، جلد کی کساوٹ، خاندانی ورثے، اور اس بات کے لحاظ سے کہ آپ کتنی بار کچھ خاص تاثرات بناتے ہیں، آپ کو ٹھوڑی کے پاس یہ عمودی لکیریں بنتی محسوس ہو سکتی ہیں۔",
      },
      { kind: "h", text: "Treatment", textUr: "علاج" },
      {
        kind: "p",
        text: "The treatment depends on severity and on the result you want, and a combination is sometimes best. We offer botulinum toxin (Botox) and dermal fillers.",
        textUr:
          "علاج کا انحصار شدت پر اور اُس نتیجے پر ہے جو آپ چاہتے ہیں، اور کبھی ایک سے زیادہ علاج ملا کر بہترین رہتے ہیں۔ ہم بوٹولینم ٹاکسن (Botox) اور ڈرمل فلرز پیش کرتے ہیں۔",
      },
    ],
  },
  {
    slug: "wrinkles-and-sagging",
    title: "Wrinkles & Sagging",
    titleUr: "جھریاں اور جلد کا ڈھلکنا",
    summary: "Loss of fat, collagen and elastin — and the treatments that help.",
    summaryUr:
      "چربی، کولاجن اور ایلاسٹن کا کم ہو جانا — اور وہ علاج جو اس میں مدد دیتے ہیں۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      {
        kind: "p",
        text: "Wrinkled and sagging skin, on both the face and the body, is often associated with the loss of fat. The deterioration or reduction of collagen and elastin in the dermis is another cause.",
        textUr:
          "چہرے اور جسم دونوں پر جھریوں والی اور ڈھلکی ہوئی جلد کا تعلق اکثر چربی کے کم ہو جانے سے ہوتا ہے۔ جلد کی درمیانی تہہ (dermis) میں کولاجن اور ایلاسٹن کا خراب ہو جانا یا کم ہو جانا اس کی دوسری وجہ ہے۔",
      },
      {
        kind: "p",
        text: "While anyone can develop sagging skin, it is more likely with age and with excessive sun exposure. It can be challenging to treat at home, but skin-tightening options help.",
        textUr:
          "اگرچہ ڈھلکی ہوئی جلد کسی کو بھی ہو سکتی ہے، مگر عمر بڑھنے اور حد سے زیادہ دھوپ لگنے سے اس کا امکان بڑھ جاتا ہے۔ گھر پر اس کا علاج مشکل ہو سکتا ہے، مگر جلد کو کسنے والے علاج مدد دیتے ہیں۔",
      },
      { kind: "h", text: "Treatment", textUr: "علاج" },
      {
        kind: "p",
        text: "We offer botulinum toxin (Botox) and dermal fillers. Which one, and in what combination, depends on the severity and on the result you are looking for.",
        textUr:
          "ہم بوٹولینم ٹاکسن (Botox) اور ڈرمل فلرز پیش کرتے ہیں۔ کون سا، اور کس امتزاج میں، اس کا انحصار شدت پر اور اُس نتیجے پر ہے جو آپ چاہتے ہیں۔",
      },
    ],
  },
  {
    slug: "nasolabial-folds",
    title: "Nasolabial Folds",
    titleUr: "ناک سے منہ تک کی لکیریں (Nasolabial Folds)",
    summary:
      "The deep lines from the nose to the corners of the mouth — causes and treatment.",
    summaryUr:
      "ناک سے منہ کے کونوں تک جانے والی گہری لکیریں — وجوہات اور علاج۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      {
        kind: "h",
        text: "What are nasolabial folds?",
        textUr: "ناسولیبیل فولڈز کیا ہیں؟",
      },
      {
        kind: "p",
        text: "Nasolabial folds are the deep wrinkles or lines that run from the bottom of the nose to the corners of the mouth. They are extremely common, though their severity varies a great deal.",
        textUr:
          "ناسولیبیل فولڈز وہ گہری جھریاں یا لکیریں ہیں جو ناک کے نچلے حصے سے منہ کے کونوں تک جاتی ہیں۔ یہ بے حد عام ہیں، اگرچہ ان کی شدت میں بہت فرق ہوتا ہے۔",
      },
      { kind: "h", text: "What causes them?", textUr: "یہ کیوں بنتی ہیں؟" },
      {
        kind: "p",
        text: "Age, sun damage and smoking are the biggest culprits. Ultraviolet rays break down the collagen and elastin fibres that keep skin smooth and supported; smoking breaks down the same fibres. As you age, cumulative damage makes the folds more prominent.",
        textUr:
          "عمر، دھوپ سے ہونے والا نقصان اور سگریٹ نوشی سب سے بڑی وجوہات ہیں۔ سورج کی الٹراوائلٹ شعاعیں کولاجن اور ایلاسٹن کے اُن ریشوں کو توڑ دیتی ہیں جو جلد کو ہموار اور سہارا دیے رکھتے ہیں؛ سگریٹ نوشی بھی انہی ریشوں کو توڑتی ہے۔ عمر بڑھنے کے ساتھ یہ نقصان جمع ہوتا جاتا ہے اور لکیریں زیادہ نمایاں ہو جاتی ہیں۔",
      },
      {
        kind: "p",
        text: "Ordinary ageing plays a part even without sun damage or smoking. The structure of the cheekbones flattens out over time, which lets the skin of the cheeks sag downwards. Add years of gravity and a natural decrease in collagen, and the folds deepen.",
        textUr:
          "دھوپ کے نقصان اور سگریٹ نوشی کے بغیر بھی عام عمر رسیدگی کا اپنا حصہ ہے۔ رخساروں کی ہڈی کی ساخت وقت کے ساتھ ہموار ہو جاتی ہے، جس سے گالوں کی جلد نیچے کی طرف ڈھلک جاتی ہے۔ اس میں برسوں کی کششِ ثقل اور کولاجن کی قدرتی کمی شامل کر لیں تو یہ لکیریں مزید گہری ہو جاتی ہیں۔",
      },
      { kind: "h", text: "Treatment", textUr: "علاج" },
      {
        kind: "p",
        text: "We offer dermal fillers, platelet-rich plasma injections, and botulinum toxin (Botox). Your doctor will help you work out the cause of your own deepening folds and the right treatment for them.",
        textUr:
          "ہم ڈرمل فلرز، پلیٹلیٹ سے بھرپور پلازما (PRP) کے انجیکشن، اور بوٹولینم ٹاکسن (Botox) پیش کرتے ہیں۔ آپ کے ڈاکٹر آپ کے ساتھ مل کر یہ طے کریں گے کہ آپ کی اپنی لکیروں کے گہرا ہونے کی وجہ کیا ہے اور اس کے لیے صحیح علاج کون سا ہے۔",
      },
    ],
  },
  {
    slug: "dark-circles-and-eye-bags",
    title: "Dark Circles & Eye Bags",
    titleUr: "آنکھوں کے نیچے سیاہ حلقے اور سوجن",
    summary: "Under-eye shadowing and puffiness, treated with PRF.",
    summaryUr:
      "آنکھوں کے نیچے کی سیاہی اور پھولا پن، جس کا علاج PRF سے کیا جاتا ہے۔",
    group: "conditions",
    section: SKIN,
    sectionUr: SKIN_UR,
    blocks: [
      {
        kind: "p",
        text: "Dark circles and eye bags are among the most common concerns people bring to the clinic. The skin under the eye is the thinnest on the face, so anything beneath it — loss of volume, shadowing, fluid — shows there first.",
        textUr:
          "آنکھوں کے نیچے سیاہ حلقے اور سوجن اُن شکایات میں سے ہیں جو لوگ سب سے زیادہ کلینک لے کر آتے ہیں۔ آنکھ کے نیچے کی جلد پورے چہرے میں سب سے پتلی ہوتی ہے، اس لیے اس کے نیچے جو کچھ بھی ہو — بھراؤ کی کمی، سایہ، یا پانی — سب سے پہلے وہیں نظر آتا ہے۔",
      },
      { kind: "h", text: "Treatment", textUr: "علاج" },
      {
        kind: "p",
        text: "We treat the under-eye area with PRF (platelet-rich fibrin) drawn from your own blood, which addresses both the hollowing that causes shadowing and the quality of the skin itself. A session takes about 60 minutes.",
        textUr:
          "ہم آنکھوں کے نیچے کے حصے کا علاج آپ ہی کے خون سے حاصل کی گئی PRF (platelet-rich fibrin) سے کرتے ہیں، جو اُس کھوکھلے پن کو بھی درست کرتی ہے جس سے سایہ بنتا ہے، اور خود جلد کی حالت کو بھی بہتر کرتی ہے۔ ایک سیشن میں تقریباً 60 منٹ لگتے ہیں۔",
      },
    ],
  },
];
