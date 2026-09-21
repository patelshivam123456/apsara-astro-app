import { PolicyContentScreen } from "@/components/PolicyContentScreen";

const sections = [
  {
    title: "Who We Are",
    body: "Apsara Astro is a spiritual guidance platform for people who want accessible astrology, numerology, horoscope, kundali, matching, and remedy-based insights in one place. We connect users with astrologers and numerology-focused tools designed for reflection, planning, and personal clarity."
  },
  {
    title: "What We Offer",
    body: "The app includes astrologer profiles, horoscope tools, numerology reports, kundali and match-making flows, wallet and subscription features, and educational spiritual content. Our goal is to make traditional guidance easier to access while keeping the experience simple, respectful, and mobile friendly."
  },
  {
    title: "Our Approach",
    body: "We present astrological and numerological information as guidance, not as a guaranteed prediction or substitute for professional advice. Users should make important life, medical, legal, financial, or safety decisions with qualified experts and their own judgment."
  },
  {
    title: "For Clients And Astrologers",
    body: "Apsara Astro is built for both clients seeking consultations and astrologers managing their profile, expertise, languages, experience, and services. We aim to create a trustworthy space where profiles are clear, payments are transparent, and consultations remain respectful."
  },
  {
    title: "Our Commitment",
    body: "We continue improving the app experience, content quality, privacy practices, and support flows so users can explore spiritual guidance with confidence and comfort."
  }
];

export default function AboutUs() {
  return (
    <PolicyContentScreen
      title="About Us"
      subtitle="Apsara Astro brings astrology, numerology, and spiritual guidance into a clear, modern mobile experience."
      icon="star-four-points"
      sections={sections}
    />
  );
}
