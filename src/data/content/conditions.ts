import type { ContentPage } from "./types";

/**
 * Conditions the clinic treats.
 *
 * Vein and circulation conditions are deliberately absent — the clinic no
 * longer offers vein care, and a condition page for something nobody here
 * treats sends a patient down a corridor with no door at the end.
 */

const MENTAL_HEALTH = "Mental health";
const SKIN = "Skin";

export const conditionPages: ContentPage[] = [
  /* ------------------------------------------------------------------ */
  /* Mental health                                                       */
  /* ------------------------------------------------------------------ */
  {
    slug: "mental-disorders",
    title: "Mental Disorders",
    summary:
      "What mental health and mental illness are, how common they are in Pakistan, and the conditions we treat.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      { kind: "h", text: "What is mental health?" },
      {
        kind: "p",
        text: "Mental health refers to your emotional and psychological well-being. Good mental health helps you lead a relatively happy and healthy life, and helps you cope in the face of life's adversities. It can be influenced by many things, including life events and your genetics.",
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
      },
      { kind: "h", text: "What is mental illness?" },
      {
        kind: "p",
        text: "Mental illness is a broad term covering a wide variety of conditions that affect the way you feel and think, and your ability to get through day-to-day life. It can be influenced by genetics, environment, daily habits and biology.",
      },
      { kind: "h", text: "How common is it?" },
      {
        kind: "p",
        text: "Mental health issues are common worldwide. In the United States, about one in five adults experiences at least one mental illness each year, and about one in five young people aged 13 to 18 experiences one at some point. The figures in Pakistan are higher still — around 34%.",
      },
      {
        kind: "p",
        text: "Although mental illness is common, severity varies. About one in 25 adults experiences a serious mental illness in a given year, which can significantly reduce the ability to carry out daily life.",
      },
      { kind: "h", text: "Conditions we treat" },
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
      },
      {
        kind: "note",
        text: "Confidential online telemedicine consultations are available, so you can speak to your doctor from the privacy of your home.",
      },
      { kind: "h", text: "Our doctors" },
      {
        kind: "p",
        text: "Our doctors trained in the U.S.A. at leading hospitals and are American Board Certified — the highest degree of specialisation — with over 30 years of experience in the U.S.A. treating patients and teaching other doctors how to diagnose and treat mental disorders.",
      },
    ],
  },
  {
    slug: "major-depressive-disorder",
    title: "Major Depressive Disorder",
    summary:
      "Extreme sadness or hopelessness lasting at least two weeks — also called clinical depression.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Major depressive disorder (MDD) causes feelings of extreme sadness or hopelessness that last for at least two weeks. It is also called clinical depression.",
      },
      {
        kind: "p",
        text: "People with MDD may become so distressed about their lives that they think about suicide. The condition is common — about 8% of people in Pakistan experience at least one major depressive episode each year.",
      },
      {
        kind: "note",
        text: "If you are having thoughts of harming yourself, please tell someone today — a doctor, a family member, or call the clinic. This is treatable, and you do not have to manage it alone.",
      },
    ],
  },
  {
    slug: "persistent-depressive-disorder",
    title: "Persistent Depressive Disorder",
    summary:
      "A chronic, lower-intensity depression — also known as dysthymia — lasting two years or more.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Persistent depressive disorder is a chronic type of depression, also known as dysthymia. While it is not as intense as a major depressive episode, it interferes with daily life, and people with this condition experience symptoms for at least two years.",
      },
    ],
  },
  {
    slug: "bipolar-disorder",
    title: "Bipolar Disorder (Manic Depression)",
    summary:
      "Episodes of energetic, manic highs and extreme lows — far beyond the ordinary ups and downs of daily life.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Bipolar disorder is a chronic mental illness affecting about 4% of Pakistanis each year. It is characterised by episodes of energetic, manic highs and extreme, sometimes depressive lows.",
      },
      {
        kind: "p",
        text: "These episodes affect a person's energy level and ability to think reasonably. The mood swings caused by bipolar disorder are much more severe than the small ups and downs most people experience day to day.",
      },
    ],
  },
  {
    slug: "generalized-anxiety-disorder",
    title: "Generalized Anxiety Disorder",
    summary:
      "Persistent, disproportionate worry about many things — even when there is little reason to worry.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Generalized anxiety disorder (GAD) goes beyond ordinary everyday anxiety, such as being nervous before a presentation. It causes a person to become extremely worried about many things, even when there is little or no reason to worry.",
      },
      {
        kind: "p",
        text: "People with GAD may feel very nervous about simply getting through the day, and may believe things will never work in their favour. Worry can reach the point of preventing everyday tasks and chores. GAD affects about 3% of Pakistanis every year.",
      },
    ],
  },
  {
    slug: "panic-disorder",
    title: "Panic Disorder",
    summary: "Sudden, intense episodes of fear with strong physical symptoms.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Panic attacks are sudden episodes of intense fear that arrive with physical symptoms — a racing heart, shortness of breath, dizziness, or a feeling that something catastrophic is about to happen. They can occur without an obvious trigger.",
      },
      {
        kind: "p",
        text: "Panic disorder is treatable. Because the physical symptoms are so strong, many people first seek help believing the problem is with their heart or their breathing, which is one reason a proper evaluation matters.",
      },
    ],
  },
  {
    slug: "obsessive-compulsive-disorder",
    title: "Obsessive-Compulsive Disorder",
    summary:
      "Repetitive, intrusive thoughts paired with compulsions that are difficult to resist.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Obsessive-compulsive disorder (OCD) causes constant, repetitive thoughts — obsessions. These occur alongside unnecessary and unreasonable urges to carry out certain behaviours, or compulsions.",
      },
      {
        kind: "p",
        text: "Many people with OCD recognise that their thoughts and actions are unreasonable, and still cannot stop them. That gap between knowing and being able to stop is the condition, not a failure of will.",
      },
    ],
  },
  {
    slug: "post-traumatic-stress-disorder",
    title: "Post-Traumatic Stress Disorder",
    summary:
      "A response triggered after experiencing or witnessing a traumatic event.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Post-traumatic stress disorder (PTSD) is triggered after experiencing or witnessing a traumatic event. The experiences that can cause it range widely — from war and natural disasters to verbal or physical abuse.",
      },
      {
        kind: "p",
        text: "Symptoms may include flashbacks, or being easily startled.",
      },
    ],
  },
  {
    slug: "schizophrenia",
    title: "Schizophrenia",
    summary:
      "A serious condition affecting perception of reality, and connection to other people.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Schizophrenia impairs a person's perception of reality and of the world around them, and interferes with their connection to other people. It is a serious condition that needs treatment.",
      },
      {
        kind: "p",
        text: "People may experience hallucinations, hold delusions, or hear voices. Left untreated, these can put them in danger — which is why early treatment matters so much.",
      },
    ],
  },
  {
    slug: "social-anxiety-disorder",
    title: "Social Anxiety Disorder",
    summary: "An extreme fear of social situations, sometimes called social phobia.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Social anxiety disorder, sometimes called social phobia, causes an extreme fear of social situations. People with social anxiety may become very nervous about being around others, and may feel they are being judged.",
      },
      {
        kind: "p",
        text: "This makes it hard to meet new people or attend social gatherings. Approximately 15 million adults in Pakistan experience social anxiety each year.",
      },
    ],
  },
  {
    slug: "mental-disorder-symptoms",
    title: "Mental Disorder Symptoms",
    summary:
      "Signs that are common across several mental illnesses, and when to reach out.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Each type of mental illness causes its own symptoms, but many share common characteristics. Common signs include:",
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
      },
      {
        kind: "p",
        text: "Stress and periods of emotional distress can bring on an episode of symptoms, making it difficult to maintain normal behaviour and activities. This is sometimes called a nervous or mental breakdown.",
      },
      {
        kind: "note",
        text: "These symptoms often get worse if they are left alone. If you recognise several of them in yourself or someone close to you, that is reason enough to book a consultation.",
      },
    ],
  },
  {
    slug: "diagnosis-and-treatment",
    title: "Diagnosis and Treatment",
    summary: "How a mental health diagnosis is actually reached, step by step.",
    group: "conditions",
    section: MENTAL_HEALTH,
    blocks: [
      {
        kind: "p",
        text: "Diagnosing a mental health disorder is a multi-step process. At a first appointment, your doctor may perform a physical examination to look for signs of physical issues that could be contributing to your symptoms, and may order laboratory tests to screen for less obvious causes.",
      },
      {
        kind: "p",
        text: "You may be asked to complete a mental health questionnaire, and may undergo a psychological evaluation. You might not have a diagnosis after the first appointment.",
      },
      {
        kind: "p",
        text: "Because mental health is complex and symptoms vary from person to person, it can take a few appointments to reach a full diagnosis. A first appointment here is deliberately longer, so your history and background can be gone through properly before any medication is started.",
      },
      {
        kind: "p",
        text: "It is worth saying plainly: you can have a full and happy life with a mental illness. Working with your doctor is how you learn healthy ways to manage the condition.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Skin                                                                */
  /* ------------------------------------------------------------------ */
  {
    slug: "acne-scars",
    title: "Acne Scars",
    summary:
      "Why acne scars form, and the treatments we offer to make them less noticeable.",
    group: "conditions",
    section: SKIN,
    blocks: [
      { kind: "h", text: "Overview" },
      {
        kind: "p",
        text: "Acne is a skin condition that occurs when hair follicles become plugged with oil and dead skin cells. It often causes whiteheads, blackheads or pimples, usually on the face, forehead, chest, upper back and shoulders. It is most common among teenagers, though it affects people of all ages.",
      },
      {
        kind: "p",
        text: "Effective treatments exist, but acne can be persistent. Pimples and bumps heal slowly, and as one begins to fade others appear. Depending on severity, acne can cause emotional distress and scar the skin. The earlier treatment starts, the lower the risk of both.",
      },
      { kind: "h", text: "Treatments we offer for acne scars" },
      {
        kind: "p",
        text: "Acne scars are stubborn, and no single treatment is best for everyone. Your doctor may suggest one of these, or a combination.",
      },
      {
        kind: "ul",
        items: [
          "**Micro-needling with PRP.** A needle-studded device is rolled over the skin to stimulate the underlying tissue, with platelet-rich plasma drawn from your own blood. Safe and simple; results build over repeated treatments.",
          "**Soft tissue fillers.** Injecting filler under indented scars fills out or stretches the skin, making scars less noticeable. Results are temporary, so injections are repeated periodically.",
          "**Botox injections.** Where the skin around acne scars puckers, relaxing the area with botulinum toxin improves the appearance. Repeated periodically.",
        ],
      },
    ],
  },
  {
    slug: "hair-thinning-hair-loss",
    title: "Hair Thinning & Hair Loss",
    summary:
      "The causes and patterns of hair loss, how it is diagnosed, and PRP treatment for regrowth.",
    group: "conditions",
    section: SKIN,
    blocks: [
      { kind: "h", text: "Overview" },
      {
        kind: "p",
        text: "Hair loss can affect just your scalp or your entire body. It can result from heredity, hormonal changes, medical conditions or medications. Anyone can experience it, though it is more common in men. Many good treatments exist to prevent further loss and to restore growth.",
      },
      { kind: "h", text: "Signs and symptoms" },
      {
        kind: "ul",
        items: [
          "**Gradual thinning on top of the head.** The most common type. In men the hair often recedes from the forehead in an M-shaped line; women typically keep the hairline but the part broadens.",
          "**Circular or patchy bald spots.** Smooth, coin-sized patches, usually on the scalp but sometimes in beards or eyebrows. The skin may itch or feel painful before the hair falls out.",
          "**Sudden loosening of hair.** A physical or emotional shock can loosen hair; handfuls may come out when combing or washing. This usually causes overall thinning rather than bald patches.",
          "**Full-body hair loss.** Some conditions and treatments, such as chemotherapy, cause loss of hair all over the body. It usually grows back.",
          "**Patches of scaling that spread over the scalp.** A sign of ringworm, sometimes with broken hair, redness, swelling and oozing.",
        ],
      },
      { kind: "h", text: "Causes" },
      {
        kind: "p",
        text: "People typically lose about 100 hairs a day without noticeable thinning, because new hair grows in at the same time. Hair loss occurs when that cycle is disrupted, or when the follicle is destroyed and replaced with scar tissue.",
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
      },
      { kind: "h", text: "Diagnosis" },
      {
        kind: "ul",
        items: [
          "**Blood test,** to uncover medical conditions related to hair loss.",
          "**Pull test.** Your doctor gently pulls several dozen hairs to see how many come out, which helps determine the stage of shedding.",
          "Other tests as indicated.",
        ],
      },
      { kind: "h", text: "Treatment" },
      {
        kind: "p",
        text: "We offer platelet-rich plasma (PRP) injection therapy for hair thinning and hair loss. Your blood is drawn and processed to extract growth-factor-rich plasma, which is injected into the scalp. Those platelets prompt inactive or newly implanted hair to enter active growth.",
      },
    ],
  },
  {
    slug: "crows-feet",
    title: "Crow's Feet",
    summary:
      "The fine lines that spread from the corners of the eyes — why they form, and how they are treated.",
    group: "conditions",
    section: SKIN,
    blocks: [
      { kind: "h", text: "Overview" },
      {
        kind: "p",
        text: "As you age, some parts of the face show it before others — the delicate area around the eyes especially. Crow's feet are the small lines spreading out from the corners of the eyes. They develop over time because of the tiny muscle contractions that happen every time you make a facial expression.",
      },
      {
        kind: "p",
        text: "There are two kinds of wrinkle. **Dynamic** wrinkles appear during muscle contraction — if your crow's feet are mainly visible when you smile, they are probably dynamic. **Static** wrinkles may worsen with contraction but are visible all the time, even at rest. Either way there are treatment options, and in some people the signs can be reversed, at least temporarily.",
      },
      { kind: "h", text: "Treatment" },
      {
        kind: "p",
        text: "What you choose depends on the severity and on the result you want; sometimes a combination works best. We offer botulinum toxin (Botox) and dermal fillers.",
      },
      { kind: "h", text: "Prevention" },
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
      },
    ],
  },
  {
    slug: "glabellar-lines",
    title: "Glabellar Lines",
    summary:
      "Forehead furrows between the eyebrows — how they differ from frown lines, and how they are treated.",
    group: "conditions",
    section: SKIN,
    blocks: [
      {
        kind: "p",
        text: "Your glabella is the skin on your forehead, between your eyebrows and above your nose. When you make facial expressions, that skin is moved by the muscles beneath it. Depending on your face shape, skin tightness, genetics and how often you make certain expressions, wavy lines develop there — glabellar lines, or forehead furrows.",
      },
      { kind: "h", text: "Glabellar lines vs frown lines" },
      {
        kind: "p",
        text: "Typically, frown lines are the vertical lines between the eyes, while glabellar lines appear above the eyebrows and run horizontally. Frown lines don't only come from frowning — smiling, laughing, or looking worried or surprised all tug at the skin over those muscles.",
      },
      { kind: "h", text: "Treatment" },
      {
        kind: "p",
        text: "**Botox and other neuromodulators** relax the muscles under the skin, making the wrinkles less noticeable. Compared with other procedures it is affordable, and the risk of side effects is small.",
      },
      {
        kind: "p",
        text: "**Soft tissue fillers** mimic the collagen and other structural components of your skin. Both approaches carry a low risk of complications; your doctor will discuss which suits your skin.",
      },
    ],
  },
  {
    slug: "marionette-lines",
    title: "Marionette Lines",
    summary: "The vertical lines that frame the chin as the cheeks droop.",
    group: "conditions",
    section: SKIN,
    blocks: [
      {
        kind: "p",
        text: "Marionette lines frame the chin vertically, and as the cheeks droop, jowl wrinkles form alongside them. Depending on your face shape, skin tightness, genetics and how often you make certain expressions, you may notice these vertical lines developing at the chin.",
      },
      { kind: "h", text: "Treatment" },
      {
        kind: "p",
        text: "The treatment depends on severity and on the result you want, and a combination is sometimes best. We offer botulinum toxin (Botox) and dermal fillers.",
      },
    ],
  },
  {
    slug: "wrinkles-and-sagging",
    title: "Wrinkles & Sagging",
    summary: "Loss of fat, collagen and elastin — and the treatments that help.",
    group: "conditions",
    section: SKIN,
    blocks: [
      {
        kind: "p",
        text: "Wrinkled and sagging skin, on both the face and the body, is often associated with the loss of fat. The deterioration or reduction of collagen and elastin in the dermis is another cause.",
      },
      {
        kind: "p",
        text: "While anyone can develop sagging skin, it is more likely with age and with excessive sun exposure. It can be challenging to treat at home, but skin-tightening options help.",
      },
      { kind: "h", text: "Treatment" },
      {
        kind: "p",
        text: "We offer botulinum toxin (Botox) and dermal fillers. Which one, and in what combination, depends on the severity and on the result you are looking for.",
      },
    ],
  },
  {
    slug: "nasolabial-folds",
    title: "Nasolabial Folds",
    summary:
      "The deep lines from the nose to the corners of the mouth — causes and treatment.",
    group: "conditions",
    section: SKIN,
    blocks: [
      { kind: "h", text: "What are nasolabial folds?" },
      {
        kind: "p",
        text: "Nasolabial folds are the deep wrinkles or lines that run from the bottom of the nose to the corners of the mouth. They are extremely common, though their severity varies a great deal.",
      },
      { kind: "h", text: "What causes them?" },
      {
        kind: "p",
        text: "Age, sun damage and smoking are the biggest culprits. Ultraviolet rays break down the collagen and elastin fibres that keep skin smooth and supported; smoking breaks down the same fibres. As you age, cumulative damage makes the folds more prominent.",
      },
      {
        kind: "p",
        text: "Ordinary ageing plays a part even without sun damage or smoking. The structure of the cheekbones flattens out over time, which lets the skin of the cheeks sag downwards. Add years of gravity and a natural decrease in collagen, and the folds deepen.",
      },
      { kind: "h", text: "Treatment" },
      {
        kind: "p",
        text: "We offer dermal fillers, platelet-rich plasma injections, and botulinum toxin (Botox). Your doctor will help you work out the cause of your own deepening folds and the right treatment for them.",
      },
    ],
  },
  {
    slug: "dark-circles-and-eye-bags",
    title: "Dark Circles & Eye Bags",
    summary: "Under-eye shadowing and puffiness, treated with PRF.",
    group: "conditions",
    section: SKIN,
    blocks: [
      {
        kind: "p",
        text: "Dark circles and eye bags are among the most common concerns people bring to the clinic. The skin under the eye is the thinnest on the face, so anything beneath it — loss of volume, shadowing, fluid — shows there first.",
      },
      { kind: "h", text: "Treatment" },
      {
        kind: "p",
        text: "We treat the under-eye area with PRF (platelet-rich fibrin) drawn from your own blood, which addresses both the hollowing that causes shadowing and the quality of the skin itself. A session takes about 60 minutes.",
      },
    ],
  },
];
