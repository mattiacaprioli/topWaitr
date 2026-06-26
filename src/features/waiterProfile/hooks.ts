import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  getMyWaiterProfile,
  saveWaiterProfile,
  type WaiterProfileInput,
} from "./api";

export function useMyWaiterProfile(userId: string) {
  return useQuery({
    queryKey: qk.profile.mine(userId),
    queryFn: () => getMyWaiterProfile(userId),
  });
}

export function useSaveWaiterProfile(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WaiterProfileInput) => saveWaiterProfile(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile.mine(userId) });
    },
  });
}
