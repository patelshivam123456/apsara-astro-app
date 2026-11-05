import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { getSubscriptionAccess } from "@/services/subscription.service";
import { useAuthStore } from "@/store/auth.store";

export function useSubscriptionAccess(userPublicId: string) {
  const token = useAuthStore((state) => state.accessToken);
  const query = useQuery({
    queryKey: ["subscription-access", userPublicId],
    queryFn: getSubscriptionAccess,
    enabled: Boolean(userPublicId && token),
    staleTime: 0
  });
  const { refetch } = query;
  useFocusEffect(useCallback(() => {
    if (userPublicId && token) void refetch();
  }, [userPublicId, token, refetch]));
  return query;
}
