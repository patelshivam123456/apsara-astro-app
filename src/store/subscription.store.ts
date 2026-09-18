import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { subscriptionPlanDetails, SubscriptionPlanId, subscriptionPlans } from "@/constants/subscription";

export type SubscriptionRecord = {
  userPublicId: string;
  planId: SubscriptionPlanId;
  planName: string;
  amount: number;
  tenure: string;
  startDate: string;
  expiryDate?: string;
  status: "Active" | "Expired";
  transactionId?: string;
};

type TrialRecord = {
  userPublicId: string;
  startedAt: string;
};

type PaymentSnapshot = {
  status: "success" | "failed";
  message?: string;
  subscription?: SubscriptionRecord;
};

type SubscriptionState = {
  trials: Record<string, TrialRecord>;
  subscriptions: Record<string, SubscriptionRecord>;
  lastPayment: PaymentSnapshot | null;
  ensureTrial: (userPublicId: string) => void;
  setActiveSubscription: (subscription: SubscriptionRecord) => void;
  setLastPayment: (payment: PaymentSnapshot) => void;
  clearLastPayment: () => void;
};

export const TRIAL_DAYS = 5;

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      trials: {},
      subscriptions: {},
      lastPayment: null,
      ensureTrial(userPublicId) {
        set((state) => {
          if (!userPublicId || state.trials[userPublicId]) return state;
          return {
            trials: {
              ...state.trials,
              [userPublicId]: {
                userPublicId,
                startedAt: new Date().toISOString()
              }
            }
          };
        });
      },
      setActiveSubscription(subscription) {
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [subscription.userPublicId]: subscription
          },
          lastPayment: { status: "success", subscription }
        }));
      },
      setLastPayment(payment) {
        set({ lastPayment: payment });
      },
      clearLastPayment() {
        set({ lastPayment: null });
      }
    }),
    {
      name: "apsara.subscription",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

export function buildSubscriptionRecord(params: {
  userPublicId: string;
  planId: SubscriptionPlanId;
  transactionId?: string;
}) {
  const plan = subscriptionPlans[params.planId];
  const detail = subscriptionPlanDetails[params.planId];
  const start = new Date();
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + getTenureMonths(plan.tenure));

  return {
    userPublicId: params.userPublicId,
    planId: params.planId,
    planName: detail.name,
    amount: plan.amount,
    tenure: plan.tenure,
    startDate: start.toISOString(),
    expiryDate: expiry.toISOString(),
    status: "Active",
    transactionId: params.transactionId
  } satisfies SubscriptionRecord;
}

export function getTrialInfo(trial?: TrialRecord) {
  if (!trial) return { trialActive: false, daysRemaining: 0, expired: true };

  const started = new Date(trial.startedAt).getTime();
  const ends = started + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const daysRemaining = Math.max(0, Math.ceil((ends - now) / (24 * 60 * 60 * 1000)));

  return {
    trialActive: now < ends,
    daysRemaining,
    expired: now >= ends
  };
}

export function isSubscriptionActive(subscription?: SubscriptionRecord) {
  if (!subscription || subscription.status !== "Active") return false;
  if (!subscription.expiryDate) return true;
  return new Date(subscription.expiryDate).getTime() > Date.now();
}

export function isWithinUpgradeWindow(subscription?: SubscriptionRecord) {
  if (!subscription?.expiryDate) return false;
  const expiryTime = new Date(subscription.expiryDate).getTime();
  const tenDaysBefore = expiryTime - 10 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return now >= tenDaysBefore && now <= expiryTime;
}

export function canSelectPlan(current: SubscriptionRecord | undefined, nextPlanId: SubscriptionPlanId) {
  if (!isSubscriptionActive(current)) return { allowed: true, reason: "" };
  if (!current) return { allowed: true, reason: "" };

  const nextRank = subscriptionPlanDetails[nextPlanId].rank;
  const currentRank = subscriptionPlanDetails[current.planId].rank;
  const inWindow = isWithinUpgradeWindow(current);

  if (nextRank < currentRank) return { allowed: false, reason: "Downgrade is not available" };
  if (!inWindow) return { allowed: false, reason: "Upgrade opens 10 days before expiry" };
  return { allowed: true, reason: nextRank === currentRank ? "Renew plan" : "Upgrade plan" };
}

function getTenureMonths(tenure: string) {
  const match = tenure.match(/^\d+/);
  return match ? Number(match[0]) : 1;
}
