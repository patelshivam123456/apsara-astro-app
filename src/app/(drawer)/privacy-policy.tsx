import { PolicyContentScreen } from "@/components/PolicyContentScreen";

const sections = [
  {
    title: "Information We Collect",
    body: "We may collect details such as your name, mobile number, email, date of birth, time and place of birth, gender, language preference, consultation history, wallet activity, payment status, and information you provide while using horoscope, kundali, matching, numerology, or profile features."
  },
  {
    title: "How We Use Information",
    body: "We use your information to create and manage your account, prepare reports, show astrologer profiles, process wallet or subscription activity, improve app features, provide support, personalize language and content, and maintain the security of the platform."
  },
  {
    title: "Astrology And Numerology Data",
    body: "Birth details, names, mobile numbers, relationship details, and similar inputs may be used to generate spiritual, astrological, numerological, or compatibility reports inside the app. These details are used only for app features, support, and service improvement."
  },
  {
    title: "Sharing Of Information",
    body: "We do not sell your personal information. We may share limited information with service providers, payment processors, technical partners, or astrologers when needed to deliver the service, comply with law, prevent misuse, or resolve support requests."
  },
  {
    title: "Payments And Wallet",
    body: "Payment and wallet-related information may be processed through secure payment partners. Apsara Astro may store transaction references, status, and plan details, but sensitive payment credentials are handled by authorized payment providers."
  },
  {
    title: "Data Security",
    body: "We use reasonable technical and organizational measures to protect user information. No digital service can guarantee complete security, so users should keep login details private and contact support if they notice suspicious activity."
  },
  {
    title: "Your Choices",
    body: "You may update account information where the app allows it, choose your preferred language, stop using optional features, or contact support for questions about your information. Some records may be retained when required for legal, payment, fraud prevention, or operational reasons."
  },
  {
    title: "Children And Sensitive Use",
    body: "Apsara Astro is intended for users who can responsibly use consultation and spiritual guidance services. Users should avoid sharing unnecessary sensitive information in chats, forms, or support requests."
  },
  {
    title: "Policy Updates",
    body: "We may update this Privacy Policy as features, laws, or business practices change. Continued use of the app after an update means you accept the revised policy."
  }
];

export default function PrivacyPolicy() {
  return (
    <PolicyContentScreen
      title="Privacy Policy"
      subtitle="How Apsara Astro collects, uses, protects, and manages information shared through the app."
      icon="shield-lock"
      sections={sections}
    />
  );
}
