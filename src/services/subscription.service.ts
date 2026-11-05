import { AxiosError, create } from "axios";
import { NativeModules, Platform } from "react-native";

import { ENDPOINTS, TRANSACTION_API_BASE_URL } from "@/constants/api";
import {
  RAZORPAY_KEY_ID,
  subscriptionPlanDetails,
  SubscriptionPlanId,
  subscriptionPlans
} from "@/constants/subscription";
import { getAccessToken } from "@/services/storage";

export type PaymentInitiatePayload = {
  userPublicId: string;
  planId: SubscriptionPlanId;
  planDescription: string;
  amount: number;
  currency: "INR";
  subscriptionTenure: string;
};

export type PaymentAcknowledgePayload = {
  transactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMode: "online";
};

export type PaymentInitiateResult = {
  raw: unknown;
  transactionId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export type RazorpaySuccessResponse = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

const transactionApi = create({
  baseURL: TRANSACTION_API_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json"
  }
});

transactionApi.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

transactionApi.interceptors.response.use((response) => response.data);

export type SubscriptionAccess = {
  kind: "trial" | "active" | "inactive";
  daysRemaining: number;
  plan: Record<string, unknown> | null;
  expiredPlans: Record<string, unknown>[];
};

export type Entitlements = {
  trial: { active: boolean; daysRemaining: number; expiresAt: string | null };
  subscription: { active: boolean; plan: string | Record<string, unknown> | null; expiresAt: string | null };
  features: { numerology: boolean; kundaliDownload: boolean };
};

export async function getMyEntitlements(): Promise<Entitlements> {
  const response = await transactionApi.get<unknown, { success: boolean; data: Entitlements }>(ENDPOINTS.myEntitlements);
  assertSuccessfulPaymentResponse(response, "Unable to load subscription access.");
  if (!response.data?.trial || !response.data.subscription || !response.data.features) {
    throw new Error("Invalid entitlements response.");
  }
  return response.data;
}

export function canUseSubscriptionFeature(entitlement: Entitlements, feature: "numerology" | "kundaliDownload") {
  if (feature === "kundaliDownload") return entitlement.features.kundaliDownload === true;
  return (entitlement.trial.active || entitlement.subscription.active) && entitlement.features.numerology === true;
}

export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  const transactions = await transactionApi.get<unknown, { success: boolean; data: Record<string, unknown>[] }>(ENDPOINTS.myTransactions);
  assertSuccessfulPaymentResponse(transactions, "Unable to load subscription details.");
  if (!Array.isArray(transactions.data)) throw new Error("Invalid transactions response.");

  if (transactions.data.length) {
    const plans = transactions.data.map(normalizeTransactionPlan);
    const plan = plans.find((record) =>
      record.current === true && record.paymentStatus === "SUCCESS" &&
      record.subscriptionStatus === "ACTIVE" &&
      (!record.expiryDate || new Date(String(record.expiryDate)).getTime() > Date.now())
    );
    const expiredPlans = plans.filter((record) => record.current !== true && (
      record.subscriptionStatus === "EXPIRED" ||
      (record.expiryDate && new Date(String(record.expiryDate)).getTime() <= Date.now())
    ));
    return { kind: plan ? "active" : "inactive", daysRemaining: 0, plan: plan ?? null, expiredPlans };
  }

  const entitlement = await getMyEntitlements();
  if (entitlement.trial.active) {
    return { kind: "trial", daysRemaining: entitlement.trial.daysRemaining, plan: null, expiredPlans: [] };
  }
  if (entitlement.subscription.active) {
    const plan = entitlement.subscription.plan;
    return {
      kind: "active", daysRemaining: 0, expiredPlans: [],
      plan: { ...(typeof plan === "object" && plan ? plan : { planName: plan }), expiresAt: entitlement.subscription.expiresAt }
    };
  }
  return { kind: "inactive", daysRemaining: 0, plan: null, expiredPlans: [] };
}

function normalizeTransactionPlan(transaction: Record<string, unknown>): Record<string, unknown> {
  const planId = String(transaction.planId ?? "") as SubscriptionPlanId;
  return {
    ...transaction,
    planName: subscriptionPlanDetails[planId]?.name ?? transaction.planDescription ?? transaction.planId,
    tenure: transaction.subscriptionTenure,
    startDate: parseSubscriptionDate(transaction.subscriptionStartDate),
    expiryDate: parseSubscriptionDate(transaction.subscriptionEndDate, true)
  };
}

function parseSubscriptionDate(value: unknown, endOfDay = false) {
  if (typeof value !== "string" || !value) return undefined;
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0).toISOString();
  }
  return Number.isNaN(Date.parse(value)) ? undefined : new Date(value).toISOString();
}

export function createPaymentInitiatePayload(
  userPublicId: string,
  planId: SubscriptionPlanId
): PaymentInitiatePayload {
  const plan = subscriptionPlans[planId];
  const detail = subscriptionPlanDetails[planId];

  return {
    userPublicId,
    planId,
    planDescription: detail.description,
    amount: plan.amount,
    currency: "INR",
    subscriptionTenure: plan.tenure
  };
}

export async function initiateSubscriptionPayment(payload: PaymentInitiatePayload) {
  const response = await transactionApi.post<unknown, unknown>(ENDPOINTS.paymentInitiate, payload);
  assertSuccessfulPaymentResponse(response, "Payment initiation failed.");

  const transactionId = getFirstString(response, [
    "transactionId",
    "transactionPublicId",
    "paymentTransactionId",
    "id"
  ]);
  const razorpayOrderId = getFirstString(response, [
    "razorpayOrderId",
    "razorpay_order_id",
    "orderId",
    "order_id"
  ]);
  const keyId = getFirstString(response, ["keyId", "razorpayKeyId", "key"]) || RAZORPAY_KEY_ID;
  const responseAmount = getFirstNumber(response, ["amount", "orderAmount"]);

  if (!transactionId) {
    throw new Error("Payment initiation did not return a transaction ID.");
  }

  if (!razorpayOrderId) {
    throw new Error("Payment initiation did not return a Razorpay order ID.");
  }

  return {
    raw: response,
    transactionId,
    razorpayOrderId,
    amount: responseAmount || payload.amount,
    currency: getFirstString(response, ["currency"]) || payload.currency,
    keyId
  } satisfies PaymentInitiateResult;
}

export async function openRazorpayCheckout(options: {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  planName: string;
  description: string;
  user?: { name?: string; email?: string; contact?: string };
}) {
  ensureRazorpayCheckoutAvailable();

  try {
    const RazorpayCheckout = (await import("react-native-razorpay")).default;
    return (await RazorpayCheckout.open({
      key: options.keyId,
      amount: Math.round(options.amount * 100),
      currency: options.currency,
      name: "Apsra Astro",
      description: options.description,
      order_id: options.razorpayOrderId,
      prefill: {
        name: options.user?.name || "",
        email: options.user?.email || "",
        contact: options.user?.contact || ""
      },
      theme: { color: "#8a6106" },
      notes: { planName: options.planName }
    })) as RazorpaySuccessResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("open") && message.includes("null")) {
      throwRazorpayRuntimeError();
    }
    throw error;
  }
}

export function ensureRazorpayCheckoutAvailable() {
  if (Platform.OS === "web") {
    throw new Error("Razorpay Checkout is not available on web. Please test payment on an Android or iOS build.");
  }

  if (!NativeModules.RNRazorpayCheckout) throwRazorpayRuntimeError();
}

function throwRazorpayRuntimeError(): never {
  throw new Error(
    "Razorpay Checkout is not available in this app runtime. Please install a new Android or iOS development build that includes the Razorpay native module."
  );
}

export async function acknowledgeSubscriptionPayment(payload: PaymentAcknowledgePayload) {
  const response = await transactionApi.post<unknown, unknown>(ENDPOINTS.paymentAcknowledge, payload);
  assertSuccessfulPaymentResponse(response, "Payment acknowledgement failed.");
  return response;
}

export function getPaymentErrorMessage(error: unknown, fallback = "Payment failed. Please try again.") {
  const axiosError = error as AxiosError<{ message?: string; errorDescription?: string }>;
  return (
    axiosError.response?.data?.errorDescription ||
    axiosError.response?.data?.message ||
    (error instanceof Error ? error.message : "") ||
    axiosError.message ||
    fallback
  );
}

function assertSuccessfulPaymentResponse(response: unknown, fallback: string) {
  const record = response as { success?: boolean; message?: string; errorDescription?: string } | null;
  if (record?.success === false) {
    throw new Error(record.errorDescription || record.message || fallback);
  }
}

function getFirstString(source: unknown, keys: string[]) {
  const value = getFirstValue(source, keys);
  return typeof value === "string" && value.trim() ? value : "";
}

function getFirstNumber(source: unknown, keys: string[]) {
  const value = getFirstValue(source, keys);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getFirstValue(source: unknown, keys: string[]): unknown {
  const queue = [source];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;

    const record = current as Record<string, unknown>;
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null) return record[key];
    }

    for (const key of ["data", "result", "response", "payment", "order", "transaction"]) {
      if (record[key] && typeof record[key] === "object") queue.push(record[key]);
    }
  }

  return undefined;
}
