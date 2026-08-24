import type { ContentPage } from "./types";

export const aboutPages: ContentPage[] = [
  {
    slug: "mission-vision-commitment",
    title: "Mission, Vision & Commitment",
    summary: "What the clinic is for, where it is going, and what it promises.",
    group: "about",
    blocks: [
      { kind: "h", text: "Mission" },
      {
        kind: "p",
        text: "To inspire hope and contribute to health and well-being by setting the standard of excellence in providing the best care to every patient — through progressive, integrated clinical practice, education and research.",
      },
      { kind: "h", text: "Vision" },
      {
        kind: "p",
        text: "To be one of the leading healthcare providers in the area, expanding our services to reach additional community members. To do that, we work to be trusted by patients, a valued partner in the community, and creators of positive change.",
      },
      { kind: "h", text: "Our commitment" },
      {
        kind: "p",
        text: "Our clinic provides a respectful, safe, trusted and innovative environment in which people explore health issues and improve their well-being. We combine the strengths of technology with irreplaceable personal contact, to create more effective relationships between doctor and patient.",
      },
      {
        kind: "p",
        text: "Our model is technologically capable, simple and comprehensive. It rests on one principle: connect the right patient to the right solution at the right time, in the most cost-efficient way. The goal is high-value healthcare.",
      },
    ],
  },
  {
    slug: "our-values",
    title: "Our Values",
    summary:
      "How we work — with patients, with the community, and with each other.",
    group: "about",
    blocks: [
      { kind: "h", text: "Our relationship with the people we serve" },
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
      },
      { kind: "h", text: "Our approach to healthcare" },
      {
        kind: "ul",
        items: [
          "We care for the whole person, see the complexity of each person's life, and believe addressing a broad range of human needs is the best way to improve health.",
          "We continuously examine the services we provide against what the community actually needs.",
          "We look for gaps in the healthcare system, fill them, and then look for the next one.",
          "We use a team approach — and the patient is part of that team.",
        ],
      },
      { kind: "h", text: "Our relationship with the community" },
      {
        kind: "ul",
        items: [
          "We are committed to serving the community and providing open access to the clinic for all its members.",
          "Involvement in the community makes us better at providing care. Improving the community improves the health of our patients.",
          "Partnerships with education, government and other organisations multiply the effect of our work.",
          "By instilling confidence in our patients, they become positive forces in the community.",
        ],
      },
      { kind: "h", text: "Our work environment" },
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
      },
    ],
  },
  {
    slug: "our-doctors",
    title: "Our Doctors",
    summary:
      "Dr. Naseem M. Chaudhry — training, board certifications and experience.",
    group: "about",
    blocks: [
      { kind: "h", text: "Dr. Naseem M. Chaudhry — M.B.B.S, M.D., D.A.B.P.N." },
      {
        kind: "p",
        text: "Dr. Naseem graduated from King Edward Medical College, Lahore in 1982. After completing his house job at Mayo Hospital, Lahore, he received extensive postgraduate training in the U.S.A., where he has over 30 years of experience in practice.",
      },
      {
        kind: "p",
        text: "He worked as a physician in Internal Medicine in the U.S.A., then completed a four-year specialisation in Psychiatry and Neurology at Northeastern Ohio University, College of Medicine — an affiliate programme of Cleveland Clinic, Akron General, Akron City, Children's Hospital and St. Thomas Hospitals in Ohio. He received American Board Certification (Diplomate) in Psychiatry & Neurology in 1993.",
      },
      {
        kind: "p",
        text: "He later completed fellowship training in specialised skin care treatments, and holds multiple U.S. certifications in cosmetic skin treatments. He is a former Assistant Professor at Ohio State University, College of Medicine in Columbus, Ohio.",
      },
      { kind: "h", text: "Top Doctor in Chicago" },
      {
        kind: "p",
        text: "Dr. Naseem Chaudhry received the Castle Connolly Medical “Top Doctor” award in Chicago, U.S.A. — awarded to one physician out of several thousand for dedicated and outstanding work in their area of specialisation.",
      },
      {
        kind: "ul",
        items: [
          "Graduated with honours from King Edward Medical College, Lahore",
          "Awarded the “Best Doctor” award and nominated as a “Top Doctor” in Chicago, U.S.A.",
          "Over 35 years of experience across a variety of medical fields in the U.S.A.",
          "American Board of Psychiatry and Neurology; American Academy of Aesthetic Medicine",
        ],
      },
    ],
  },
];
