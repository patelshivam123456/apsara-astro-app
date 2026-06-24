export type WalletTransaction = {
  id: string;
  type: "credit" | "debit";
  desc: string;
  amount: number;
  date: string;
};

export const initialWallet = {
  balance: 520,
  transactions: [
    { id: "1", type: "credit", desc: "Wallet Recharge", amount: 200, date: "May 9" },
    { id: "2", type: "debit", desc: "Chat - Dr. Aryan Sharma", amount: -96, date: "May 9" },
    { id: "3", type: "credit", desc: "Cashback Reward", amount: 50, date: "May 8" }
  ] satisfies WalletTransaction[]
};
