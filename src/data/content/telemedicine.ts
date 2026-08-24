import type { ContentPage } from "./types";

export const telemedicinePages: ContentPage[] = [
  {
    slug: "what-is-telemedicine",
    title: "What is Telemedicine?",
    summary:
      "Healthcare conducted remotely, by phone or video — virtual appointments with our doctors, without travelling to the clinic.",
    group: "telemedicine",
    blocks: [
      {
        kind: "p",
        text: "Telemedicine is healthcare conducted remotely, through the use of a phone or the internet. It lets you have a virtual appointment with our doctors without needing to travel to a medical office.",
      },
      {
        kind: "p",
        text: "Telemedicine visits let you meet our psychiatrist and other doctors in real time, on your own schedule. Sometimes called an online doctor visit, these appointments let our specialists follow your condition through a simple phone call or an online video consultation.",
      },
      { kind: "h", text: "The process is as simple as 1, 2, 3" },
      {
        kind: "ol",
        items: [
          "Book online from this website, or call the clinic to make a telemedicine appointment.",
          "Pay your fee online through our secure checkout.",
          "Join the video call from your dashboard at the appointment time — no separate app to download.",
        ],
      },
      {
        kind: "note",
        text: "Your session runs inside your own patient dashboard on this site. There is nothing to install, and the call is encrypted per session.",
      },
      { kind: "h", text: "What telemedicine is used for" },
      {
        kind: "p",
        text: "**Initial diagnosis.** Consult a psychiatrist or skin specialist for the first time about your concerns, to receive a diagnosis or a treatment recommendation. An e-visit can also help determine what type of care you need. Treatment recommendations and prescriptions are sent to you after the visit is completed.",
      },
      {
        kind: "p",
        text: "**Monitoring skin or mental health conditions.** If you have already been diagnosed, telemedicine visits are a straightforward way to meet our doctors, follow your symptoms and identify signs of progression or improvement.",
      },
      {
        kind: "p",
        text: "**Follow-up visits.** If you have already been treated here and want to follow up after a procedure, a telemedicine visit saves you the journey. Call us to confirm and we will set it up at a time that suits you.",
      },
    ],
  },
  {
    slug: "benefits",
    title: "Benefits of Telemedicine",
    summary:
      "Expert medical and psychiatric care from home — no traffic, no time off work, no childcare to arrange.",
    group: "telemedicine",
    blocks: [
      {
        kind: "p",
        text: "Telemedicine makes quality medical and psychiatric care more cost-effective and more accessible. It is now easier than ever to receive expert care from the comfort of your home. Online visits are also a good solution if you need care but live far from the clinic — you no longer have to lose time in traffic for a short consultation.",
      },
      {
        kind: "p",
        text: "Telemedicine means flexibility. Rather than taking time off work or arranging childcare to reach an appointment, you can meet a psychiatrist or skin specialist on your own time.",
      },
      { kind: "h", text: "Additional benefits" },
      {
        kind: "ul",
        items: [
          "Efficient if you are far from the clinic but want to consult a specialist.",
          "Virtual visits mean time is spent with family rather than in traffic — and the cost of care comes down.",
          "Flexible enough to fit around work. No more missing a day for a fifteen-minute review.",
          "You can see a specialist from home, which means no childcare to arrange.",
          "The same compassionate care you would receive at an in-office visit.",
        ],
      },
      {
        kind: "p",
        text: "Think of your telemedicine visit as a normal doctor's visit. The difference is that you meet the doctor over video rather than in the room.",
      },
    ],
  },
  {
    slug: "how-it-works",
    title: "How does it Work?",
    summary:
      "What happens during a telemedicine appointment, and what you need at your end.",
    group: "telemedicine",
    blocks: [
      {
        kind: "p",
        text: "A telemedicine appointment is a virtual meeting between you and one of our doctors, at a time you choose. Video is used when you have concerns about visible symptoms or when you request it; otherwise the visit can be conducted by voice.",
      },
      { kind: "h", text: "What you need" },
      {
        kind: "ul",
        items: [
          "A reasonable internet connection.",
          "A phone, tablet or computer with a camera and microphone — most have both built in.",
          "A quiet, private few minutes.",
        ],
      },
      {
        kind: "p",
        text: "During your visit you will be asked about your medical history, and about your mental health or other symptoms, so the doctor can discuss them properly with you. You can pay online through our secure checkout at the time you book.",
      },
      {
        kind: "note",
        text: "We do not store credit card, debit card or bank details on our own servers. Payments are handled by the payment provider.",
      },
      { kind: "h", text: "Accessible care from our experts" },
      {
        kind: "p",
        text: "As technology and healthcare continue to advance, telemedicine keeps becoming more useful. The savings in cost and time help make care from experienced professionals reachable for people who would otherwise go without it — particularly for psychiatric and mental health conditions, where getting to a clinic is often the hardest part.",
      },
    ],
  },
];
