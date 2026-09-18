import type { ContentPage } from "./types";

export const aboutPages: ContentPage[] = [
  {
    slug: "mission-vision-commitment",
    title: "Mission, Vision & Commitment",
    titleUr: "مشن، وژن اور ہمارا عہد",
    summary: "What the clinic is for, where it is going, and what it promises.",
    summaryUr:
      "کلینک کس مقصد کے لیے ہے، کس طرف جا رہا ہے، اور کیا وعدہ کرتا ہے۔",
    group: "about",
    blocks: [
      { kind: "h", text: "Mission", textUr: "مشن" },
      {
        kind: "p",
        text: "To inspire hope and contribute to health and well-being by setting the standard of excellence in providing the best care to every patient — through progressive, integrated clinical practice, education and research.",
        textUr:
          "امید جگانا، اور ہر مریض کو بہترین علاج فراہم کرنے میں اعلیٰ معیار قائم کر کے صحت اور تندرستی میں اپنا حصہ ڈالنا — ترقی پسند اور باہم جڑے ہوئے طبی عمل، تعلیم اور تحقیق کے ذریعے۔",
      },
      { kind: "h", text: "Vision", textUr: "وژن" },
      {
        kind: "p",
        text: "To be one of the leading healthcare providers in the area, expanding our services to reach additional community members. To do that, we work to be trusted by patients, a valued partner in the community, and creators of positive change.",
        textUr:
          "اپنے علاقے کے نمایاں ترین طبی اداروں میں شامل ہونا، اور اپنی خدمات کو بڑھا کر معاشرے کے مزید لوگوں تک پہنچانا۔ اس کے لیے ہماری کوشش یہ ہے کہ مریض ہم پر بھروسہ کریں، ہم معاشرے کے ایک قابلِ قدر ساتھی بنیں، اور مثبت تبدیلی لانے والے بنیں۔",
      },
      { kind: "h", text: "Our commitment", textUr: "ہمارا عہد" },
      {
        kind: "p",
        text: "Our clinic provides a respectful, safe, trusted and innovative environment in which people explore health issues and improve their well-being. We combine the strengths of technology with irreplaceable personal contact, to create more effective relationships between doctor and patient.",
        textUr:
          "ہمارا کلینک ایک ایسا ماحول دیتا ہے جو باعزت، محفوظ، قابلِ اعتماد اور نئے طریقوں کو اپنانے والا ہے — جہاں لوگ اپنی صحت کے مسائل کو سمجھ سکیں اور اپنی تندرستی بہتر کر سکیں۔ ہم ٹیکنالوجی کی خوبیوں کو اُس ذاتی رابطے کے ساتھ ملاتے ہیں جس کا کوئی نعم البدل نہیں، تاکہ ڈاکٹر اور مریض کا رشتہ زیادہ مؤثر بن سکے۔",
      },
      {
        kind: "p",
        text: "Our model is technologically capable, simple and comprehensive. It rests on one principle: connect the right patient to the right solution at the right time, in the most cost-efficient way. The goal is high-value healthcare.",
        textUr:
          "ہمارا طریقۂ کار ٹیکنالوجی کے لحاظ سے مضبوط، سادہ اور ہر پہلو کو سمیٹنے والا ہے۔ اس کی بنیاد ایک اصول پر ہے: صحیح مریض کو صحیح وقت پر صحیح حل تک پہنچانا، اور وہ بھی سب سے کم خرچ طریقے سے۔ مقصد یہ ہے کہ مریض کو اپنے خرچ کا پورا فائدہ ملے۔",
      },
    ],
  },
  {
    slug: "our-values",
    title: "Our Values",
    titleUr: "ہماری اقدار",
    summary:
      "How we work — with patients, with the community, and with each other.",
    summaryUr:
      "ہم کس طرح کام کرتے ہیں — مریضوں کے ساتھ، معاشرے کے ساتھ، اور ایک دوسرے کے ساتھ۔",
    group: "about",
    blocks: [
      {
        kind: "h",
        text: "Our relationship with the people we serve",
        textUr: "جن لوگوں کی ہم خدمت کرتے ہیں، اُن سے ہمارا تعلق",
      },
      {
        kind: "ul",
        items: [
          "The patient always comes first. We are dedicated to patient care.",
          "We treat each person with respect and dignity.",
          "We are compassionate listeners. We hear the issues our patients bring, respect them, and do everything in our power to help.",
          "We provide patient-centred service — polite, friendly, helpful staff who relate to each person as an individual, recognising their history, relationships, culture and needs.",
          "We keep ourselves well educated so we can apply new developments in our fields.",
          "We seek diversity in our staff and value what it adds to how we communicate with patients.",
          "We believe patients deserve timely access to healthcare, and that our systems should reflect that.",
        ],
        itemsUr: [
          "مریض ہمیشہ پہلے ہے۔ ہم مریض کی دیکھ بھال کے لیے وقف ہیں۔",
          "ہم ہر شخص سے عزت اور احترام کے ساتھ پیش آتے ہیں۔",
          "ہم ہمدردی سے سننے والے لوگ ہیں۔ مریض جو مسئلہ لے کر آتے ہیں، ہم اسے سنتے ہیں، اس کی قدر کرتے ہیں، اور مدد کے لیے جو کچھ ہمارے بس میں ہو وہ سب کرتے ہیں۔",
          "ہماری خدمت مریض کے گرد گھومتی ہے — مہذب، خوش اخلاق اور مددگار عملہ، جو ہر شخص کو ایک الگ فرد سمجھ کر ملتا ہے اور اس کے حالات، رشتوں، ثقافت اور ضرورتوں کا خیال رکھتا ہے۔",
          "ہم اپنی تعلیم جاری رکھتے ہیں تاکہ اپنے شعبوں میں آنے والی نئی پیش رفت کو عملی طور پر استعمال کر سکیں۔",
          "ہم اپنے عملے میں مختلف پس منظر کے لوگ رکھنا چاہتے ہیں، اور اس بات کی قدر کرتے ہیں کہ اس سے مریضوں سے بات چیت کرنے کا ہمارا انداز بہتر ہوتا ہے۔",
          "ہمارا ماننا ہے کہ مریض کا حق ہے کہ اسے بروقت علاج ملے، اور ہمارا نظام بھی اسی کے مطابق ہونا چاہیے۔",
        ],
      },
      {
        kind: "h",
        text: "Our approach to healthcare",
        textUr: "علاج کے بارے میں ہمارا نقطۂ نظر",
      },
      {
        kind: "ul",
        items: [
          "We care for the whole person, see the complexity of each person's life, and believe addressing a broad range of human needs is the best way to improve health.",
          "We continuously examine the services we provide against what the community actually needs.",
          "We look for gaps in the healthcare system, fill them, and then look for the next one.",
          "We use a team approach — and the patient is part of that team.",
        ],
        itemsUr: [
          "ہم پورے انسان کا خیال رکھتے ہیں، ہر شخص کی زندگی کی پیچیدگی کو دیکھتے ہیں، اور یہ مانتے ہیں کہ انسان کی مختلف ضرورتوں کو سامنے رکھنا ہی صحت بہتر بنانے کا سب سے اچھا راستہ ہے۔",
          "ہم مسلسل جائزہ لیتے رہتے ہیں کہ ہماری فراہم کردہ خدمات اور معاشرے کی اصل ضرورت میں کتنی مطابقت ہے۔",
          "ہم نظامِ صحت میں کمی تلاش کرتے ہیں، اسے پورا کرتے ہیں، اور پھر اگلی کمی ڈھونڈنے نکل پڑتے ہیں۔",
          "ہم ٹیم کے طور پر کام کرتے ہیں — اور مریض بھی اسی ٹیم کا حصہ ہے۔",
        ],
      },
      {
        kind: "h",
        text: "Our relationship with the community",
        textUr: "معاشرے سے ہمارا تعلق",
      },
      {
        kind: "ul",
        items: [
          "We are committed to serving the community and providing open access to the clinic for all its members.",
          "Involvement in the community makes us better at providing care. Improving the community improves the health of our patients.",
          "Partnerships with education, government and other organisations multiply the effect of our work.",
          "By instilling confidence in our patients, they become positive forces in the community.",
        ],
        itemsUr: [
          "ہم معاشرے کی خدمت کے لیے پُرعزم ہیں، اور چاہتے ہیں کہ کلینک کے دروازے اس کے ہر فرد کے لیے کھلے رہیں۔",
          "معاشرے سے جڑے رہنا ہمیں بہتر علاج کرنے کے قابل بناتا ہے۔ معاشرہ بہتر ہوگا تو ہمارے مریضوں کی صحت بھی بہتر ہوگی۔",
          "تعلیمی اداروں، حکومت اور دوسرے اداروں کے ساتھ شراکت ہمارے کام کا اثر کئی گنا بڑھا دیتی ہے۔",
          "جب ہم اپنے مریضوں میں اعتماد پیدا کرتے ہیں تو وہ خود معاشرے میں ایک مثبت قوت بن جاتے ہیں۔",
        ],
      },
      {
        kind: "h",
        text: "Our work environment",
        textUr: "ہمارے کام کا ماحول",
      },
      {
        kind: "ul",
        items: [
          "In all we do, we actively pursue excellence and look for the next level of accomplishment.",
          "Our integrity and ethics will never be compromised.",
          "We are as respectful, friendly, helpful and supportive to one another as we are to our patients.",
          "Teamwork is central. We each take responsibility for contributing to it.",
          "We recognise and appreciate the contributions of individuals and teams, and we reward suggestions and innovation.",
          "We have a strong work ethic, and we don't stifle individual personalities. Fun and humour are healthy — for us and for our patients.",
        ],
        itemsUr: [
          "ہم جو بھی کام کرتے ہیں اس میں بہترین معیار کے پیچھے جاتے ہیں اور اگلے درجے کی کامیابی کی تلاش میں رہتے ہیں۔",
          "اپنی دیانت اور اخلاقی اصولوں پر ہم کبھی سمجھوتہ نہیں کریں گے۔",
          "ہم ایک دوسرے کے ساتھ بھی اتنے ہی باعزت، خوش اخلاق، مددگار اور سہارا دینے والے ہیں جتنے اپنے مریضوں کے ساتھ۔",
          "مل کر کام کرنا ہمارے ہاں بنیادی بات ہے۔ ہم میں سے ہر ایک اپنا حصہ ڈالنے کا ذمہ دار ہے۔",
          "ہم افراد اور ٹیموں کی محنت کو پہچانتے اور سراہتے ہیں، اور اچھی تجاویز اور نئے خیالات پر انعام دیتے ہیں۔",
          "ہم کام کو سنجیدگی سے لیتے ہیں، مگر کسی کی شخصیت کو دبا کر نہیں رکھتے۔ ہنسی مذاق اور خوش مزاجی صحت کے لیے اچھی ہے — ہمارے لیے بھی اور ہمارے مریضوں کے لیے بھی۔",
        ],
      },
    ],
  },
  {
    slug: "our-doctors",
    title: "Our Doctors",
    titleUr: "ہمارے ڈاکٹر",
    summary:
      "Dr. Naseem M. Chaudhry — training, board certifications and experience.",
    summaryUr:
      "Dr. Naseem M. Chaudhry — تربیت، بورڈ کی اسناد اور تجربہ۔",
    group: "about",
    blocks: [
      {
        kind: "h",
        text: "Dr. Naseem M. Chaudhry — M.B.B.S, M.D., D.A.B.P.N.",
        textUr: "Dr. Naseem M. Chaudhry — M.B.B.S, M.D., D.A.B.P.N.",
      },
      {
        kind: "p",
        text: "Dr. Naseem graduated from King Edward Medical College, Lahore in 1982. After completing his house job at Mayo Hospital, Lahore, he received extensive postgraduate training in the U.S.A., where he has over 30 years of experience in practice.",
        textUr:
          "Dr. Naseem نے 1982 میں King Edward Medical College, Lahore سے سند حاصل کی۔ Mayo Hospital, Lahore میں ہاؤس جاب مکمل کرنے کے بعد انہوں نے امریکہ میں تفصیلی پوسٹ گریجویٹ تربیت حاصل کی، اور وہیں انہیں مریضوں کے علاج کا 30 سال سے زیادہ تجربہ ہے۔",
      },
      {
        kind: "p",
        text: "He worked as a physician in Internal Medicine in the U.S.A., then completed a four-year specialisation in Psychiatry and Neurology at Northeastern Ohio University, College of Medicine — an affiliate programme of Cleveland Clinic, Akron General, Akron City, Children's Hospital and St. Thomas Hospitals in Ohio. He received American Board Certification (Diplomate) in Psychiatry & Neurology in 1993.",
        textUr:
          "انہوں نے امریکہ میں انٹرنل میڈیسن کے ڈاکٹر کے طور پر کام کیا، پھر Northeastern Ohio University, College of Medicine سے نفسیات اور اعصابی امراض (Psychiatry and Neurology) میں چار سالہ تخصص مکمل کیا — یہ Ohio کے Cleveland Clinic، Akron General، Akron City، Children's Hospital اور St. Thomas Hospitals کے ساتھ منسلک پروگرام ہے۔ 1993 میں انہیں Psychiatry & Neurology میں American Board Certification (Diplomate) حاصل ہوئی۔",
      },
      {
        kind: "p",
        text: "He later completed fellowship training in specialised skin care treatments, and holds multiple U.S. certifications in cosmetic skin treatments. He is a former Assistant Professor at Ohio State University, College of Medicine in Columbus, Ohio.",
        textUr:
          "بعد میں انہوں نے جلد کے خصوصی علاج میں فیلوشپ کی تربیت مکمل کی، اور جلد کی خوبصورتی کے علاج میں امریکہ کی کئی اسناد رکھتے ہیں۔ وہ Ohio State University, College of Medicine (Columbus, Ohio) میں اسسٹنٹ پروفیسر رہ چکے ہیں۔",
      },
      {
        kind: "h",
        text: "Top Doctor in Chicago",
        textUr: "شکاگو میں ٹاپ ڈاکٹر",
      },
      {
        kind: "p",
        text: "Dr. Naseem Chaudhry received the Castle Connolly Medical “Top Doctor” award in Chicago, U.S.A. — awarded to one physician out of several thousand for dedicated and outstanding work in their area of specialisation.",
        textUr:
          "Dr. Naseem Chaudhry کو امریکہ کے شہر شکاگو میں Castle Connolly Medical کا ”ٹاپ ڈاکٹر“ ایوارڈ ملا — یہ ایوارڈ کئی ہزار ڈاکٹروں میں سے کسی ایک کو دیا جاتا ہے، اپنے شعبۂ تخصص میں لگن اور نمایاں کارکردگی پر۔",
      },
      {
        kind: "ul",
        items: [
          "Graduated with honours from King Edward Medical College, Lahore",
          "Awarded the “Best Doctor” award and nominated as a “Top Doctor” in Chicago, U.S.A.",
          "Over 35 years of experience across a variety of medical fields in the U.S.A.",
          "American Board of Psychiatry and Neurology; American Academy of Aesthetic Medicine",
        ],
        itemsUr: [
          "King Edward Medical College, Lahore سے اعزاز کے ساتھ فارغ التحصیل",
          "امریکہ کے شہر شکاگو میں ”بہترین ڈاکٹر“ کا ایوارڈ، اور ”ٹاپ ڈاکٹر“ کے لیے نامزدگی",
          "امریکہ میں طب کے مختلف شعبوں میں 35 سال سے زیادہ کا تجربہ",
          "American Board of Psychiatry and Neurology؛ American Academy of Aesthetic Medicine",
        ],
      },
    ],
  },
];
