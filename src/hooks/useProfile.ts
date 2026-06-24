import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getClientProfile, updateClientProfile } from "@/services/profile.service";

export function useClientProfile() {
  return useQuery({ queryKey: ["client-profile"], queryFn: getClientProfile });
}

export function useUpdateClientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-profile"] })
  });
}
