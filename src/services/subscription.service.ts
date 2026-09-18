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
