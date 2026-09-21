import { PolicyContentScreen } from "@/components/PolicyContentScreen";

const sections = [
  {
    title: "Acceptance Of Terms",
    body: "By creating an account, browsing astrologers, purchasing a plan, using wallet features, generating reports, or using any Apsara Astro service, you agree to these Terms & Conditions and any policies shown inside the app."
  },
  {
    title: "Nature Of Services",
    body: "Apsara Astro provides astrology, numerology, horoscope, kundali, matching, remedy, and consultation-related services for guidance and personal reflection. Results and consultations are based on spiritual and traditional practices and should not be treated as guaranteed outcomes."
  },
  {
    title: "User Responsibilities",
    body: "You agree to provide accurate information, keep your account secure, use the app lawfully, avoid abusive or misleading behavior, and respect astrologers, support staff, and other users. You are responsible for decisions you make after using app content or consultations."
  },
  {
    title: "Astrologer Profiles And Consultations",
    body: "Astrologer details such as expertise, languages, experience, availability, and pricing are shown to help users choose a suitable expert. Availability, consultation modes, and pricing may change based on profile updates, business rules, or app settings."
  },
  {
    title: "Payments, Wallet, And Subscriptions",
    body: "Paid features, wallet credits, subscriptions, and consultation charges may be subject to plan rules, payment partner terms, taxes, and app-specific pricing. Transactions should be reviewed before confirmation. Refunds, if any, are handled according to the applicable service and payment rules."
  },
  {
    title: "Reports And Calculations",
    body: "Numerology, horoscope, kundali, compatibility, and similar reports depend on the information entered by the user and the calculation method used by the app. Incorrect inputs may produce inaccurate or incomplete results."
  },
  {
    title: "No Professional Advice",
    body: "Apsara Astro does not provide medical, legal, financial, mental health, or emergency advice. For important or urgent matters, you should consult a qualified professional or emergency service."
  },
  {
    title: "Account Restrictions",
    body: "We may restrict, suspend, or terminate access if a user misuses the platform, violates these terms, attempts fraud, abuses support or astrologers, interferes with app security, or uses the service in a harmful or unlawful way."
  },
  {
    title: "Changes To Services",
    body: "We may add, remove, update, pause, or change app features, pricing, content, reports, consultation modes, or availability. We try to keep the experience reliable, but uninterrupted access is not guaranteed."
  },
  {
    title: "Limitation Of Liability",
    body: "To the maximum extent permitted by law, Apsara Astro is not responsible for losses arising from reliance on spiritual guidance, user-entered information, third-party payment issues, temporary service interruptions, or decisions made after using the app."
  }
];

export default function TermsAndConditions() {
  return (
    <PolicyContentScreen
      title="Terms & Conditions"
      subtitle="The rules and responsibilities that apply when using Apsara Astro services, tools, reports, and consultations."
      icon="file-document-check"
      sections={sections}
    />
  );
}
