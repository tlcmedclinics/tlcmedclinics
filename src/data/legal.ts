/**
 * The clinic's Terms of Service and Privacy Practices, as data.
 *
 * Transcribed from the document the clinic supplied ("TLC Privacy and Terms of
 * Use 2026"). It is their lawyer's wording, not a rewrite: a legal document
 * that has been "tidied up" is a different legal document, and neither this
 * file nor the person editing it is qualified to make that call.
 *
 * Two pages are built from one source. `termsDoc` is the whole thing; the
 * privacy page shows the sections that govern personal and health information
 * and links to the full document, because that is a presentation choice rather
 * than a legal split — nothing is dropped, and no clause is quietly reassigned
 * from one document to the other.
 *
 * Payment gateways ask for both URLs during merchant onboarding, which is the
 * immediate reason these exist as pages rather than as a PDF download.
 */

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  /** A boxed warning. Used for the emergency notice, and nothing else. */
  | { kind: "alert"; text: string };

export type LegalSection = {
  /** Stable id — these get linked to from the on-page contents. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  title: string;
  summary: string;
  lastRevised: string;
  sections: LegalSection[];
};

export const LAST_REVISED = "26 August 2026";

const electronicCommunications: LegalSection = {
  id: "electronic-communications",
  heading: "Electronic communications",
  blocks: [
    {
      kind: "p",
      text: "When you send e-mails, text messages, and other communications from your desktop or mobile device to TLC Med Clinics or use our Service, you are communicating with us electronically. You consent to receive a variety of communications from us electronically. You understand and agree that (a) all agreements and consents can be signed electronically and (b) all disclosures, notices, and other communications that we provide to you electronically satisfy any legal requirement that such notices and other communications be in writing.",
    },
  ],
};

const emergencyNotice: LegalSection = {
  id: "emergency",
  heading: "Please note",
  blocks: [
    {
      kind: "alert",
      text: "If you have a medical or mental health emergency, or if at any time you are concerned about your care or treatment, please call your local emergency service or go to the nearest emergency room. Use of the Services is not for emergencies.",
    },
    {
      kind: "alert",
      text: "If you are considering or contemplating suicide, or feel that you are a danger to yourself or to others, you must discontinue use of the Services immediately, call your local emergency service, or notify appropriate police or emergency medical personnel.",
    },
  ],
};

const privacySection: LegalSection = {
  id: "privacy",
  heading: "Privacy",
  blocks: [
    {
      kind: "p",
      text: "When you use the Services, TLC Med Clinics will collect certain personally identifiable information from you. When you use the Services, TLC Med Clinics has access to, and in many cases will monitor, your usage of the Services. By using the Services, you agree that TLC Med Clinics may collect, use, and disclose information you provide during your use of the Services. As part of providing you the Services, we may need to provide you with certain communications, such as appointment reminders, service announcements and administrative messages. These communications are considered part of the Services and your Account, which you may not be able to opt out from receiving. In addition, certain cookies may be left on your computer or handheld device, which help us in identifying your device.",
    },
    {
      kind: "p",
      text: "Secure electronic messaging is always preferred to insecure email, but under specific circumstances, insecure email communication containing protected health information (“PHI”) may take place between you and TLC Med Clinics.",
    },
    {
      kind: "p",
      text: "For your convenience, TLC Med Clinics lets you choose whether to receive email communications containing PHI. This email communication is not encrypted and may include messages from your Treatment Provider, appointment reminders, treatment referrals, and prescription information.",
    },
    {
      kind: "p",
      text: "You should consider that standard email is not a secure means of communication. There is some risk that any PHI contained in email may be disclosed to, or intercepted, printed, or stored by, unauthorized third parties. TLC Med Clinics cannot ensure the security or confidentiality of messages sent by email.",
    },
    {
      kind: "p",
      text: "You will receive email communication from TLC Med Clinics and Treatment Providers. If you choose to receive PHI in emails, you authorize TLC Med Clinics to send you messages that include PHI. This authorization indicates you understand and accept the risks involved with insecure email communication of your PHI.",
    },
    {
      kind: "p",
      text: "You may always elect not to receive message content containing PHI. In that case, you would instead receive secure notifications of new messages that require you to log in to TLC Med Clinics’ secure site to read message content. We recommend this option if you want to increase the security and confidentiality of your communications on TLC Med Clinics.",
    },
    {
      kind: "p",
      text: "You may revoke this request by changing this setting at any time on the user registration page, at the bottom of emails from TLC Med Clinics, or in your account profile even if you have requested us to send email containing PHI to you.",
    },
    {
      kind: "p",
      text: "TLC Med Clinics also may contact you to cancel, schedule or reschedule appointments via phone. By providing your contact information and agreeing to these Terms of Service, you give your consent to TLC Med Clinics to leave voice messages or speak with third parties at the phone numbers provided by you. Such contact by TLC Med Clinics will not divulge your personal health information and will be limited to confirmation or rescheduling of appointments with Providers. If you wish to opt out of such communications, please contact customer services to request “Confidential Communications” and all reasonable requests shall be accommodated.",
    },
  ],
};

const thirdPartyAccess: LegalSection = {
  id: "third-party-access",
  heading: "Third party access to your account",
  blocks: [
    {
      kind: "p",
      text: "Upon your request and consent, TLC Med Clinics will grant access to a third party, such as someone in your physician’s or therapist’s office, or other third party, or a care coordinator. For the purpose of setting up your user account, that account will have to be activated by you using the activation key sent to the email account that you provided us and to no other email account. By activating the account you are agreeing to be bound by these Terms of service, and to grant access to that third party to the contents of your user account, TLC Med Clinics Profile, Treatment Provider notes, appointment reminders and record of consultations/sessions conducted through the Site, until such time as you revoke this access by emailing a secure message via your TLC Med Clinics account to the TLC Med Clinics Administrator requesting removal of that third party’s access to your account.",
    },
  ],
};

const dashboardAndProfile: LegalSection = {
  id: "your-profile",
  heading: "Your dashboard and profile",
  blocks: [
    {
      kind: "p",
      text: "TLC Med Clinics has created a specific dashboard for customers in order to conveniently access the site. Your TLC Med Clinics profile will be established and maintained for you as a registered user of the Services to enter, store, and access your health information online, and for your Treatment Providers to communicate with you about your care. Most of these functions can be accessed by you through this dashboard once you have logged into your account. This may include history, current conditions, symptoms, complaints, allergies and medications. All of the information contained in your TLC Med Clinics profile will be maintained in accordance with our Terms and our Privacy Policy. You agree to provide accurate and complete information for your TLC Med Clinics profile, to periodically review such information, and to update information that you provide as needed.",
    },
    {
      kind: "p",
      text: "Treatment Providers may add electronic progress notes to their TLC Med Clinics account or personal records after consultations with you, detailing the findings, diagnosis, treatment plan, and recommendations, including any laboratory tests that were ordered and any medications that were prescribed by your Treatment Provider. We will make available to your Treatment Provider and others you have authorized, any progress notes and other information in your TLC Med Clinics profile.",
    },
    {
      kind: "p",
      text: "We may also include in your TLC Med Clinics profile information provided by your employer or its third-party administrator, or your health insurer, concerning your health plan application, medical history, and claims information. You consent to our access to this information and to our adding it to your TLC Med Clinics profile. This information will assist us in verifying your identity and it will assist our Treatment Providers in providing online treatment and counseling services to you. As part of your TLC Med Clinics profile, this information will be subject to the protections under our Privacy Policy.",
    },
    {
      kind: "p",
      text: "It is your responsibility to confirm the accuracy of any third party information uploaded to your TLC Med Clinics profile.",
    },
    {
      kind: "p",
      text: "It is the obligation of each of your Treatment Providers and TLC Med Clinics to use and disclose any information included in your TLC Med Clinics profile in accordance with applicable state and federal laws, including, without limitation, obtaining any consents for treatment or authorizations that may be required for your information to be shared with third parties. By registering for the Services and designating your Treatment Provider(s) and other authorized representatives, you agree to disclose the contents of your complete TLC Med Clinics profile to your designated Treatment Provider(s).",
    },
    {
      kind: "p",
      text: "Except for counselling sessions which are not recorded, all communications transmitted through the Services, including without limitation TLC Med Clinics’ secure messaging platform, may be monitored for quality assurance, training and other purposes. By accepting these Terms of Service, you consent to any such monitoring. Similarly, all messages transmitted through TLC Med Clinics’ secure messaging platform are saved and become part of your TLC Med Clinics profile.",
    },
  ],
};

const children: LegalSection = {
  id: "children",
  heading: "Use of the Services by children",
  blocks: [
    {
      kind: "p",
      text: "The provision of online medical treatment and counseling services by Treatment Providers through the Services is available for use by children age 3 and above, but the registered user for all patients under the age of 18 must be the patient’s parent or legal guardian. If you register as the parent or legal guardian on behalf of a minor, you will be fully responsible for complying with our Terms and our Privacy Policy and you accept these Terms and Privacy Practices as applicable to your dependents, in just the same way as it applies to you.",
    },
  ],
};

const userSuppliedMaterial: LegalSection = {
  id: "user-supplied-material",
  heading: "User supplied material",
  blocks: [
    {
      kind: "p",
      text: "If you supply any comments, information, or material via the Site, you represent and warrant to us that you have the legal right to supply such material and that it will not violate any law or the rights of any person or entity. Except for any individually identifiable health information you submit to us, all information or material you supply to us through the Site shall be deemed and shall remain our property, and you hereby assign to TLC Med Clinics all right, title, and interest in and to any such information or material, without any restriction or obligation to you.",
    },
  ],
};

const contactingUs: LegalSection = {
  id: "contact",
  heading: "Contacting us",
  blocks: [
    {
      kind: "p",
      text: "We encourage you to contact us if you have any questions concerning our Terms. Please note that email communications will not necessarily be secure; accordingly, you should not include credit card information or other sensitive information in your email correspondence with us. If you would like to contact us via physical mail, our mailing address is: TLC Med Clinics, 221 G-1, Johar Town, Lahore, Pakistan.",
    },
  ],
};

/** The complete document, in the order the clinic's own copy sets out. */
export const termsDoc: LegalDoc = {
  title: "Terms of Service and Privacy Practices",
  summary:
    "The agreement between you and TLC Med Clinics when you use this website, book an appointment, or speak to one of our Treatment Providers.",
  lastRevised: LAST_REVISED,
  sections: [
    electronicCommunications,
    {
      id: "what-this-means",
      heading: "What this document means to you",
      blocks: [
        {
          kind: "p",
          text: "This is a legal document which outlines TLC Med Clinics’ relationship with you, as a subscriber and user of our services and products. We urge you to read this document in its entirety. By becoming a registered user and/or accessing and/or using our Services, our Site(s), or any portion of the Services or the Site(s), you agree to be bound by these Terms and all applicable laws and regulations governing the Services at all times. If you do not agree to these Terms, you are not authorized to access or use the Services for any purpose. Your access to and use of the Services is conditioned on your full agreement and compliance with these Terms.",
        },
        {
          kind: "p",
          text: "There are other areas on our site where you will find additional terms and conditions applicable to those specific areas of the Site or to particular transactions. Together with these general Terms, they govern your use of those specific areas. If you do not agree with any of these additional terms and conditions, you are not authorized to access or use those areas of the Site.",
        },
        {
          kind: "p",
          text: "Please note that our Privacy Practices, even though a separate document, are also a part of our Terms of Service, which you are agreeing to. If you do not agree with these Terms and Conditions, then you are not authorized to access and use our Services.",
        },
        {
          kind: "p",
          text: "Please print and keep a copy of this Agreement. TLC Med Clinics may, from time to time, change the terms of this Agreement. It is your responsibility to review these terms each time you use this website.",
        },
        {
          kind: "p",
          text: "We welcome you to our Site and access to our Services through any and all mobile Applications (“Apps”) where we are re-defining the delivery of healthcare. You are electing to join TLC Med Clinics to access medical, psychiatric and counseling services using our e-platform over the Internet and by using and downloading our specific “Apps” for different handheld devices. TLC Med Clinics is a medical service provider, and we provide an e-platform to facilitate communications between treatment providers and patients, provide administrative services to health plans, health benefits to employers and their employees, as well as other Integrated Delivery Networks. We will refer to our Company and any other subsidiaries and affiliates as “we”, “us”, or “our”. “You” or “your” or similar terms refer to you as a user of our Services.",
        },
      ],
    },
    {
      id: "your-agreement",
      heading: "Your agreement with these terms",
      blocks: [
        {
          kind: "p",
          text: "Please read the following important terms and conditions (“Terms”) carefully. It is your responsibility to periodically review these Terms as we may modify and change any of these Terms from time to time. These Terms govern your access to and use of the Services. These “Terms” constitute a binding legal agreement among you, as a user of the Services, and TLC Med Clinics and any other entities controlling, controlled by or under common control with the foregoing (collectively, “TLC Med Clinics,” “we”, “us” or “our”). Any disputes that may arise require use of arbitration to resolve. In addition, these terms also limit your remedies in the event of a dispute.",
        },
        {
          kind: "p",
          text: "TLC Med Clinics is an e-health platform. We offer to connect patients, directly and in connection with our affiliated health plans with our network of affiliated medical and mental health professionals (“Treatment Providers”) to obtain online medical, psychiatric, counseling and therapy services. Treatment Providers may include, but are not limited to, medical physicians, pediatricians, dermatologists, psychiatrists, psychologists, nurses, counselors, clinical social workers, and marriage and family therapists. “Treatment Providers” include employees, agents, or independent contractors of Treatment Providers. Treatment Providers listed on TLC Med Clinics are paid for their clinical services and have no financial interest in TLC Med Clinics. Treatment Providers listed on TLC Med Clinics have an active licence in the respective states listed on their profile.",
        },
      ],
    },
    emergencyNotice,
    thirdPartyAccess,
    {
      id: "what-we-do",
      heading: "What we do",
      blocks: [
        {
          kind: "p",
          text: "The TLC Med Clinics e-health platform includes, without limitation, the following services (collectively, the “Services”):",
        },
        {
          kind: "ul",
          items: [
            "We provide a secure customer portal for the facilitation of telephonic, video chat and electronic communications with Treatment Providers.",
            "The provision of provider appointment scheduling tools and reminders, insurance verification tools, claims submission and processing, payment of service provided, electronic medical records, ability to upload documents and pictures, and other services related to online medical and psychiatric consultations, counseling and therapy services for both our registered users and Treatment Providers.",
            "The provision of other information about TLC Med Clinics and our products and services through our website (the “Site”) or through use of our “Apps”.",
            "The vehicle for any conflict resolution that may arise during the normal course of business.",
          ],
        },
      ],
    },
    {
      id: "treatment-providers",
      heading: "Treatment Providers",
      blocks: [
        {
          kind: "p",
          text: "Treatment Providers are not the employees or agents of TLC Med Clinics. Each treatment provider is an independent contractor. Each Treatment Provider is responsible for obtaining your informed consent to any medical or psychiatric diagnosis or treatment, including without limitation, your consent to use telehealth in the course of any consultation conducted through the Services, to the extent such consent is required by applicable law.",
        },
      ],
    },
    {
      id: "medical-advice",
      heading: "Delivery of medical advice",
      blocks: [
        {
          kind: "p",
          text: "To the extent medical advice is provided to you by a Treatment Provider through the Services, such medical advice is based on your personal health information and data as provided by you and according to the local standards of care for your presenting symptoms. Responses are not provided by TLC Med Clinics, but are provided exclusively by your Treatment Provider. The services do not include the provision of medical care, medical advice, mental health services, or other professional services by TLC Med Clinics.",
        },
      ],
    },
    {
      id: "member-access",
      heading: "Who can access member portions of the Site",
      blocks: [
        {
          kind: "p",
          text: "By attempting to use our services and by submitting your user name and password, you declare that you are at least 18 years of age and that you are agreeing to and consenting to all terms and conditions specified in this document and at other places in the site, including the consent for treatment and your authorization for us to submit claims to your insurance and collect for the services provided to you by the healthcare providers. Access to certain portions of the Site and/or certain Content is restricted to registered users of our Services and their authorized representatives.",
        },
        {
          kind: "p",
          text: "If you want to use your health insurance to help pay for Treatment Provider services (“Treatment Provider Services”) delivered through TLC Med Clinics, you will be asked to provide necessary information and you must identify your health insurance information so that we can confirm your eligibility during the registration process. You also must provide us with personal identification information, billing information, and certain other information, as specified in the Site. We need this information so that we can verify your identity, request confirmation of your eligibility from your insurer, if any, initiate billing processes and charges, and make all the member benefits available to you through the Site. This information will only be used by us and our Treatment Providers, you and your authorized representatives, as permitted by our Terms and our Privacy Policy.",
        },
      ],
    },
    {
      id: "payment-policies",
      heading: "Payment policies for services",
      blocks: [
        {
          kind: "p",
          text: "You agree to promptly pay all fees and charges for Treatment Provider Services, and you authorize us to automatically deduct all applicable charges and fees from the payment account(s) you designate in your TLC Med Clinics user profile and/or during scheduling your consult.",
        },
        {
          kind: "p",
          text: "Regardless of insurance reimbursement, payment to your Treatment Provider(s) or TLC Med Clinics on behalf of your Treatment Provider(s), as applicable, for co-payments, deductibles and co-insurance amounts for Treatment Provider Services, is required at the time of each appointment. If you do not have insurance coverage for Treatment Provider Services, or if your coverage is denied, you acknowledge and agree that you shall be personally responsible for all incurred expenses and agree to pay all such expenses on your behalf or on behalf of your dependent children.",
        },
        {
          kind: "p",
          text: "Finally, in order to access the member-only portions of the Services, you must provide us with a current, valid email address so that we may contact you. By creating an Account, you agree to keep your email address updated.",
        },
        {
          kind: "p",
          text: "There is no guarantee that you will be accepted as a registered user, or as a patient by one of our Treatment Providers. Even if you are accepted as a patient by a Treatment Provider, your Treatment Provider may determine that online treatment or counseling services are not appropriate for some or all of your treatment needs, and accordingly may elect not to provide online treatment or counseling services to you through the Services in your Treatment Provider’s sole discretion.",
        },
      ],
    },
    {
      id: "missed-appointments",
      heading: "Missed appointments",
      blocks: [
        {
          kind: "p",
          text: "You understand and agree that you will be responsible for a missed appointment fee equal to the fees you and your insurer or other payor would have paid for the scheduled services if you do not cancel a scheduled appointment at least twenty four hours in advance.",
        },
      ],
    },
    {
      id: "accounts",
      heading: "Registered user accounts",
      blocks: [
        {
          kind: "p",
          text: "In order to access certain features of the Services you will be required to become a registered user of the Services by creating a TLC Med Clinics account (“Account”). There is no charge to create and maintain an account, and no credit card is necessary to set up an account. To create an Account, you must be of legal age to form a binding contract. If you are not of legal age to form a binding contract, you may not register to use our Services. When you register, you will be asked to choose a password. You are responsible for safeguarding and maintaining the confidentiality of your password and you agree not to disclose your password to any third party. You will be solely responsible for any activities or actions taken under your Account, whether or not you have authorized such activities or actions. You must notify us immediately if you know or suspect that any unauthorized person is using your password or your Account. We strongly recommend that you do not use the Services on public computers. We also recommend that you do not store your password through your web browser or other software.",
        },
        {
          kind: "p",
          text: "You agree that the information that you provide to us at all times, including during registration and in any information you upload to your TLC Med Clinics online profile maintained by or through the Services will be true, accurate, current, and complete at all times. This information includes, but is not limited to, name, address, phone numbers, email addresses, payment information, insurance information, and account numbers. Changes can be made in your user profile. You are solely responsible for the accuracy and completeness of your information. Each time you log in to our Services, you will have the option to check and update your profile information. By using the Services, you are consenting to truthfully complete questions to the best of your knowledge and ability. By creating an Account, you expressly consent to the use of: (a) electronic means to complete these Terms and to provide you with any notices given pursuant to these Terms; and (b) electronic records to store information related to these Terms or your use of the Services. TLC Med Clinics cannot and will not be liable for any loss or damage arising from your failure to comply with the above requirements.",
        },
      ],
    },
    {
      id: "provider-profiles",
      heading: "Treatment Provider profiles",
      blocks: [
        {
          kind: "p",
          text: "As part of TLC Med Clinics’ e-health platform, TLC Med Clinics may provide profile pages for Treatment Providers to enable them to post relevant information about their education, training, experience, and areas of specialization, preferences and availability. Treatment Providers are solely and exclusively responsible for the content of their respective profiles, and TLC Med Clinics expressly disclaims any and all liability for the content of the Treatment Provider profiles, including, without limitation, the accuracy or reliability of any information contained therein. It is your sole responsibility to check and verify any and all information in the Treatment Provider profile.",
        },
      ],
    },
    dashboardAndProfile,
    {
      id: "responsibility-for-care",
      heading: "Responsibility for your care",
      blocks: [
        {
          kind: "p",
          text: "Your medical and behavioral health care are solely the responsibility of you and your Treatment Provider(s).",
        },
        {
          kind: "p",
          text: "Under the Services, medical and behavioral health advice and services are provided exclusively by Treatment Providers. TLC Med Clinics supports Treatment Providers by providing them with a licence to our TLC Med Clinics intellectual property rights, including our patented or patent pending inventions, trade secrets, copyrights, trademarks, service marks, trade dress and proprietary and confidential information, access to TLC Med Clinics’ technology platform, and administrative services. However, under the Services, exclusive control and responsibility for the practice of medicine and delivery of medical and behavioral health services is reserved to Treatment Providers.",
        },
        {
          kind: "p",
          text: "All Treatment Providers available through the Services represent that they have degrees, licences and/or certifications, as applicable, in the areas of medicine, medical specialities, psychiatry, psychology, marriage and family therapy, clinical social work, or counseling. TLC Med Clinics attempts to confirm the credentials of all Treatment Providers and to validate that they are in good standing with their respective licensure board(s). However, TLC Med Clinics is not responsible for credentialing Treatment Providers, makes no representation regarding the accuracy of Treatment Providers’ credentials, and expressly disclaims any liability for fraudulent credentials or claims by Treatment Providers. In addition, changes in your Treatment Provider’s professional status could occur between the time we perform an initial credential check and the time you select your Treatment Provider. We recommend that you separately confirm that your Treatment Provider is in good standing with his or her respective licensing and certification board(s).",
        },
      ],
    },
    children,
    privacySection,
    userSuppliedMaterial,
    {
      id: "restrictions",
      heading: "Restrictions on conduct",
      blocks: [
        {
          kind: "p",
          text: "In consideration for permission to use TLC Med Clinics you agree to abide by all applicable terms of use when posting and not to do any of the following, which can result in your immediate account cancellation.",
        },
        {
          kind: "p",
          text: "The Services may be used and accessed for lawful purposes only. You agree to abide by all applicable local, state, national and foreign laws, treaties and regulations in connection with your use of the Services.",
        },
        {
          kind: "p",
          text: "In addition, without limitation, you agree that you will not do any of the following while using or accessing the Services:",
        },
        {
          kind: "ul",
          items: [
            "Use TLC Med Clinics for any purpose in violation of local, state, federal, or international laws.",
            "Engage in any other conduct that restricts or inhibits any other person from using or enjoying TLC Med Clinics, or which, in the judgment of TLC Med Clinics, exposes us or any of our members, partners or suppliers to any liability or detriment of any type.",
            "Email, upload, post, or otherwise transmit any Content to which you do not have the lawful right to copy, transmit and display.",
            "Upload, post, email or otherwise transmit any Content that infringes the intellectual property rights or violates the privacy rights of any third party.",
            "Use the Services to collect or store personal data about other users without their express permission.",
            "Knowingly include or use any false or inaccurate information in any profile.",
            "Upload, post, email or otherwise transmit any unsolicited or unauthorized advertising, promotional materials, junk mail, spam, chain letters, “pyramid schemes”, Ponzi schemes, or any other form of solicitation.",
            "Circumvent, disable, or otherwise interfere with security-related features of the Services or features that prevent or restrict use or copying of any Content.",
            "Use any meta tags or other hidden text or metadata utilizing a TLC Med Clinics name, trademark, URL or product name.",
            "Attempt to probe, scan or test the vulnerability of any TLC Med Clinics system or network or breach or impair or circumvent any security or authentication measures protecting the Services.",
            "Attempt to decipher, decompile, disassemble, reverse engineer, or otherwise attempt to discover or determine the source code of any software or any proprietary algorithm used to provide the Services.",
            "Use the Services in any way that competes with TLC Med Clinics.",
            "Misrepresent one’s identity or pose as a current or prospective patient in order to solicit or recruit Treatment Providers, directly or indirectly.",
            "Post material that is unlawful, misleading, obscene, derogatory, defamatory, threatening, harassing, abusive, slanderous, hateful, or embarrassing to any other person or entity as determined by us in our sole discretion.",
            "Attempt to upload viruses or other computer code that may interrupt, destroy, limit the functionality of the Services, or interfere with the access of any other user to the Services.",
            "Encourage or instruct any other person or entity to do any of the foregoing.",
          ],
        },
      ],
    },
    {
      id: "intellectual-property",
      heading: "Our ownership of intellectual property rights",
      blocks: [
        {
          kind: "p",
          text: "The website Design, its look and feel, and all its Functionality, the Services, the Site, the Logo, and all Information and/or Content that you see, hear, or otherwise experience on the Site (collectively, “Content”) are protected by Pakistan, U.S. and international copyright, trademark, and other laws. We have conceived and developed all content on the website. We own or have the licence to use all of the intellectual property rights relating to TLC Med Clinics, the Services, the Site, and the Content, including, without limitation, all intellectual property rights protected as patent pending or patented inventions, copyrights, trademarks, trade secrets, service marks, trade dress, or proprietary or confidential information, and whether or not they happened to be registered. You will not acquire any intellectual property rights in TLC Med Clinics by your use of the Services or the Site.",
        },
      ],
    },
    {
      id: "your-licence",
      heading: "Your licence to use the Services",
      blocks: [
        {
          kind: "p",
          text: "All of your rights to use and enjoy our site and services are expressly contained in these Terms of Service and no other rights are granted or assumed under any circumstances. Subject to your compliance with the terms and conditions, TLC Med Clinics grants you a limited, non-exclusive, non-transferable and revocable licence, without the right to sublicense, to access and use the Services and to download and print any Content provided by TLC Med Clinics solely for your personal and non-commercial purposes. You may not use, copy, adapt, modify, prepare derivative works based upon, distribute, licence, sell, transfer, publicly display, publicly perform, transmit, stream, broadcast or otherwise exploit the Services or Content, except as expressly permitted in these Terms. No licences or rights are granted to you by implication or otherwise under any intellectual property rights owned or controlled by TLC Med Clinics or its licensors, except for the licences and rights expressly granted in these Terms.",
        },
      ],
    },
    {
      id: "termination",
      heading: "Termination and cancellation of services",
      blocks: [
        {
          kind: "p",
          text: "Accessing our Services is a privilege granted to you under the Terms of Service described herein to which you have agreed. TLC Med Clinics has the right (but not the obligation) to refuse to provide access to the Service to any person, agency or organization at any time, for any reason or for no reason at all, temporarily or permanently, in our sole discretion. TLC Med Clinics, our website, Services, and our company is continually evolving and innovating. We may change our Services, our Site, the Content we offer, and the products or services you may access at any time. We may discontinue offering our Services or Site at any time and we may suspend or terminate your right to use our Services or Site at any time, in the event that you breach these Terms, for any reason, or for no reason at all, in our sole discretion, and without prior notice to you. After such termination, TLC Med Clinics will have no further obligation to provide the Services, except to the extent we are obligated to provide you access to your health records or Treatment Providers are required to provide you with continuing care under their applicable legal, ethical and professional obligations to you.",
        },
        {
          kind: "p",
          text: "Upon termination of your right to use our Services or Site or our termination of the Services or Site, all licences and other rights granted to you by these Terms will immediately terminate.",
        },
        {
          kind: "p",
          text: "You may terminate your Account at any time and for any reason by sending TLC Med Clinics notice or deactivating your account through your Profile and your account will no longer be accessible. Any cancellation request will be handled as soon as possible but no later than 30 days of receipt of such a request by TLC Med Clinics.",
        },
        {
          kind: "p",
          text: "Any suspension, termination, or cancellation will not affect your obligations to TLC Med Clinics under these Terms which by their nature are intended to survive such suspension, termination, or cancellation. For example, but not by way of limitation, upon any such suspension, termination, or cancellation the provisions of Ownership of Intellectual Property Rights, Third Party Websites, Interest-Based and Other Advertisements, Disclaimer of Warranties, Indemnification, Limitation of Liability, General Terms, Arbitration, and Governing Law and Forum for Disputes shall survive and remain in full force and effect, but the provisions of Your Licence to Use the Services shall be suspended, terminated or cancelled.",
        },
      ],
    },
    {
      id: "warranties",
      heading: "Disclaimer of warranties",
      blocks: [
        {
          kind: "p",
          text: "TLC Med Clinics does not provide any warranties of any kind, expressed or implied in any way to anyone. Your use of the Services and Content is at your sole discretion and risk. The Services and Content, and all information, materials, products and services included therein, are provided on an “AS IS” and “AS AVAILABLE” basis without warranties of any kind.",
        },
        {
          kind: "p",
          text: "TLC Med Clinics and its licensors and affiliates expressly disclaim all warranties of any kind, expressed, implied, or statutory, relating to the Services and Content, including without limitation the warranties of title, merchantability, fitness for a particular purpose, non-infringement of proprietary rights, course of dealing, or course of performance. TLC Med Clinics and its licensors and affiliates make no warranty that the Content you access on our website or using our Service satisfies the laws and regulations requiring the disclosure of information for prescription drug products or other products or services.",
        },
        {
          kind: "p",
          text: "In addition, TLC Med Clinics and its licensors and affiliates disclaim any warranties regarding security, accuracy, reliability, timeliness and performance of the Services or that the Services will be error free or that any errors will be corrected. No advice or information provided to you by TLC Med Clinics will create any warranty that is not expressly stated in these Terms of Service.",
        },
        {
          kind: "p",
          text: "We make no representations concerning, and do not guarantee, the accuracy of the Services, including, but not limited to, any information provided through the Services or their applicability to your individual circumstances. Some jurisdictions do not permit us to exclude warranties in these ways, so it is possible that these exclusions will not apply to our agreement with you. In such event the exclusions shall apply to the fullest extent permitted under applicable law.",
        },
      ],
    },
    {
      id: "indemnification",
      heading: "Indemnification",
      blocks: [
        {
          kind: "p",
          text: "You will indemnify, defend, and hold harmless TLC Med Clinics, TLC Med Clinics’ licensors and affiliates and our respective directors, officers, employees, contractors, agents and representatives, from and against any and all claims, causes of action, demands, liabilities, losses, costs or expenses (including, but not limited to, reasonable attorneys’ fees and expenses) arising out of or relating to any of the following matters:",
        },
        {
          kind: "ul",
          items: [
            "Your access to or use of the Services, the Site, or the Content.",
            "Your violation of any of the provisions of these Terms of Service.",
            "Any activity related to your Account by you or any other person accessing the Site or Services through your account, including, without limitation, negligent or wrongful conduct.",
            "Your violation of any third party right, including, without limitation, any intellectual property right, publicity, confidentiality, property or privacy right.",
          ],
        },
        {
          kind: "p",
          text: "TLC Med Clinics reserves the right, at our own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you will cooperate with us in asserting any available defenses.",
        },
      ],
    },
    {
      id: "liability",
      heading: "Limitation of liability",
      blocks: [
        {
          kind: "p",
          text: "In no event will TLC Med Clinics or TLC Med Clinics’ licensors or affiliates be liable to you for any damages whatsoever, including without limitation, indirect, incidental, special, punitive or consequential damages, or lost profits, arising out of or in connection with your use of the Services, the Site, or the Content, whether the damages are foreseeable and whether or not TLC Med Clinics has been advised of the possibility of such damages in advance. If you are dissatisfied with the Services, the Site or the Content, or the Terms, your sole and exclusive remedy is to discontinue using the Site.",
        },
        {
          kind: "p",
          text: "Nothing herein shall limit the potential professional liability of our Treatment Providers or other licensed healthcare professionals arising from or related to medical or mental health advice, diagnosis, or treatment they provide to you, except as provided under applicable laws. In many jurisdictions, Treatment Providers are required to report confidential information if they have reason to believe that a patient is likely to harm others or himself or herself. In no event shall TLC Med Clinics be liable for the disclosure of your confidential information by a Treatment Provider from whom you receive medical or mental health services. TLC Med Clinics is not liable to any person or user for any harm caused by the negligence or misconduct of a Treatment Provider providing medical or mental health services. In no event will the cumulative liability of TLC Med Clinics or TLC Med Clinics’ licensors or affiliates to you, whether in contract, tort, or otherwise, exceed ten thousand Pakistani Rupees (Rs. 10,000).",
        },
        {
          kind: "p",
          text: "Except as otherwise required by applicable law, any claim or cause of action arising out of or relating to your use of the Services, the Site or the Content or our relationship with you, regardless of theory, must be brought within one (1) year after the occurrence of the event giving rise to the claim or cause of action or be forever barred.",
        },
        {
          kind: "p",
          text: "Some jurisdictions do not permit us to limit our liability in these ways, so it is possible that these limitations will not apply to our agreement with you. In such event the limitations shall apply to the fullest extent permitted under applicable law.",
        },
      ],
    },
    {
      id: "third-party-links",
      heading: "Advertisements, third-party websites and other links",
      blocks: [
        {
          kind: "p",
          text: "We may make available, on our Site and as part of our Services, links to third-party websites or resources from third parties on the Site.",
        },
        {
          kind: "p",
          text: "TLC Med Clinics is not responsible or liable for the availability or accuracy of, and TLC Med Clinics does not endorse, sponsor, or recommend such websites or resources, or the content, products, or services on or available from such websites or resources. When we make available such third-party links or resources on the Site or through the Services, you must look solely to the third party with respect to the content, products, or services they provide. We do not endorse and are not responsible for any of the content, products, or services provided by others. Your use of the websites or resources of third parties is at your own risk. TLC Med Clinics and its affiliates will not be liable for any of your losses arising out of or relating to the websites or resources of third parties.",
        },
      ],
    },
    {
      id: "errors",
      heading: "Errors and inaccuracies",
      blocks: [
        {
          kind: "p",
          text: "The information on the Site including, without limitation, information regarding pricing, may contain typographical errors or other errors or inaccuracies, and may not be complete or current. TLC Med Clinics reserves the right to correct any errors, inaccuracies, or omissions and to change or update information at any time without prior notice to you. TLC Med Clinics will not, however, guarantee that any such errors, inaccuracies, or omissions will be corrected. TLC Med Clinics reserves the right to refuse to fill any orders or provide Services that are based on inaccurate or erroneous information on the Site, including, without limitation, incorrect or out-of-date information regarding pricing, payment terms, or for any other lawful reason.",
        },
      ],
    },
    {
      id: "general",
      heading: "General terms",
      blocks: [
        {
          kind: "p",
          text: "These Terms of Service constitute the entire agreement between you and us relating to our Services, the Site, and the Content, replacing any prior or contemporaneous agreements, whether written or oral, unless you have signed a separate written agreement with us relating to our Services, the Site, or the Content. If there is any conflict between the Terms and a separate signed written agreement between you and us relating to our Services, the Site, or the Content, the signed written agreement will control. Only the executive officers of TLC Med Clinics have the authority to sign a separate signed written agreement between you and us.",
        },
        {
          kind: "p",
          text: "Our licensors may be entitled to enforce this agreement as third-party beneficiaries. There are no other third-party beneficiaries to this agreement.",
        },
        {
          kind: "p",
          text: "The failure by you or us to enforce any provision of the Terms will not constitute a waiver. If any court of law, having the jurisdiction to decide the matter, rules that any provision of the Terms is invalid or unenforceable, then the invalid or unenforceable provision shall be removed from the Terms or reformed by the court and given effect so as to best accomplish the essential purpose of the invalid or unenforceable provision, and all of the other provisions of the Terms shall continue to be valid and enforceable. Nothing contained in these Terms of Service shall limit the ability of a party to seek an injunction or other equitable relief without posting any bond. The titles of the Sections of the Terms are for convenience only and shall have no legal or contractual effect.",
        },
      ],
    },
    {
      id: "arbitration",
      heading: "Arbitration",
      blocks: [
        {
          kind: "p",
          text: "For any claim (excluding claims for injunctive or other equitable relief) where the total amount of the award sought is less than Rs. 10,000.00, the party requesting relief may elect to resolve the dispute in a cost effective manner through binding non-appearance-based arbitration. The parties must comply with the following rules:",
        },
        {
          kind: "ul",
          items: [
            "The arbitration shall be conducted in accordance with the applicable comprehensive arbitration rules and procedures, except as otherwise specified below.",
            "The arbitration shall be conducted by telephone, online and/or be solely based on written submissions; the specific manner shall be chosen by the party initiating the arbitration.",
            "The arbitration shall not involve any personal appearance by the parties or witnesses unless otherwise mutually agreed by the parties.",
            "Any judgment on the award rendered by the arbitrator may be entered in any court of competent jurisdiction.",
          ],
        },
        {
          kind: "p",
          text: "Any dispute, controversy, or disagreement arising out of or relating to these Terms, the breach thereof, or the subject matter thereof, where the total amount of the award sought is Rs. 10,000.00 or greater, shall be settled exclusively by binding arbitration. The arbitration shall be held in the City of Lahore, Pakistan unless the parties mutually agree to have such proceeding in some other locale. To the extent of the subject matter of the arbitration, the arbitration shall be binding not only on all parties to these Terms, but on any entity controlled by, in control of or under common control with the party to the extent that such affiliate joins in the arbitration, and judgment on the award rendered by the arbitrator may be entered in any court having jurisdiction thereof.",
        },
      ],
    },
    {
      id: "governing-law",
      heading: "Governing law and forum for disputes",
      blocks: [
        {
          kind: "p",
          text: "These Terms of Service and our relationship with you shall be governed by the laws of Pakistan, excluding its choice of laws rules. You and TLC Med Clinics each irrevocably agree that the exclusive venue for any action or proceeding is the courts in the City of Lahore, Pakistan. You and TLC Med Clinics each irrevocably consent to the personal jurisdiction of these courts and waive any and all objections to the exercise of jurisdiction by these courts and to this venue. Notwithstanding the foregoing, however, you and TLC Med Clinics agree that TLC Med Clinics may commence and maintain an action or proceeding seeking injunctive or other equitable relief in any court of competent jurisdiction.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      blocks: [
        {
          kind: "p",
          text: "We reserve the right to change our Terms at any time. Any changes that we make will become a part of our agreement with you when they are posted to our Site. Your continued use of our Services or the Site will constitute your agreement to the changes we have made. The last date these Terms were revised is set forth at the end of this document.",
        },
      ],
    },
    contactingUs,
  ],
};

/**
 * The privacy-facing sections, for /privacy.
 *
 * A presentation of part of the same document, not a second agreement. The page
 * says so at the top and links to the full text — a patient who wants the whole
 * thing must never have to guess whether they are reading all of it.
 */
export const privacyDoc: LegalDoc = {
  title: "Privacy Practices",
  summary:
    "How TLC Med Clinics collects, uses and protects your personal and health information. These practices form part of our Terms of Service.",
  lastRevised: LAST_REVISED,
  sections: [
    privacySection,
    electronicCommunications,
    thirdPartyAccess,
    dashboardAndProfile,
    children,
    userSuppliedMaterial,
    contactingUs,
  ],
};
