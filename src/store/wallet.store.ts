import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { initialWallet, WalletTransaction } from "@/services/wallet.service";

type WalletState = {
  balance: number;
  transactions: WalletTransaction[];
  addMoney: (amount: number) => void;
  deductMoney: (amount: number, desc: string) => void;
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      ...initialWallet,
      addMoney(amount) {
        if (!amount || amount <= 0) return;
        set((state) => ({
          balance: Number((state.balance + amount).toFixed(2)),
          transactions: [
            {
              id: String(Date.now()),
              type: "credit",
              desc: "Wallet Recharge",
              amount,
              date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            },
            ...state.transactions
          ]
        }));
      },
      deductMoney(amount, desc) {
        set((state) => ({
          balance: Number((state.balance - amount).toFixed(2)),
          transactions: [
            {
              id: String(Date.now()),
              type: "debit",
              desc,
              amount: -amount,
              date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            },
            ...state.transactions
          ]
        }));
      }
    }),
    { name: "apsara.wallet", storage: createJSONStorage(() => AsyncStorage) }
  )
);
