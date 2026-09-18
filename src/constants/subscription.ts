export const subscriptionPlans = {
  "AST-BASIC-A51": {
    amount: 399,
    tenure: "1 Month"
  },
  "AST-POPULAR-B68": {
    amount: 1099,
    tenure: "3 Months"
  },
  "AST-VALUE-C73": {
    amount: 1999,
    tenure: "6 Months"
  },
  "AST-PREMIUM-D84": {
    amount: 3699,
    tenure: "12 Months"
  }
} as const;

export type SubscriptionPlanId = keyof typeof subscriptionPlans;

export const subscriptionPlanDetails: Record<
  SubscriptionPlanId,
  {
    name: string;
    icon: string;
    rank: number;
    badge?: string;
    description: string;
    features: string[];
  }
> = {
  "AST-BASIC-A51": {
    name: "Basic Plan",
    icon: "leaf",
    rank: 1,
    description: "1 Month Astrology Subscription",
    features: ["Daily horoscope", "Numerology reports", "Lo Shu grid report", "Basic compatibility"]
  },
  "AST-POPULAR-B68": {
    name: "Popular Plan",
    icon: "star",
    rank: 2,
    badge: "Most Popular",
    description: "3 Months Astrology Subscription",
    features: ["Everything in Basic", "Tarot reading", "Name numerology", "Detailed compatibility"]
  },
  "AST-VALUE-C73": {
    name: "Value Plan",
    icon: "diamond-stone",
    rank: 3,
    badge: "Best Value",
    description: "6 Months Astrology Subscription",
    features: ["Everything in Popular", "Career report", "Relationship report", "Yearly prediction"]
  },
  "AST-PREMIUM-D84": {
    name: "Premium Plan",
    icon: "crown",
    rank: 4,
    badge: "Maximum Savings",
    description: "12 Months Astrology Subscription",
    features: ["Everything in Value", "Full life report", "Match making", "Priority support"]
  }
};

export const orderedSubscriptionPlanIds = Object.keys(subscriptionPlans) as SubscriptionPlanId[];

export const RAZORPAY_KEY_ID = "rzp_test_TbZY6T4D1QQel2";
