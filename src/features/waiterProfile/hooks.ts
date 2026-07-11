import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  getMyWaiterProfile,
  getWaiterProfileById,
  saveWaiterProfile,
  type WaiterProfileInput,
} from "./api";

export function useMyWaiterProfile(userId: string) {
  return useQuery({
    queryKey: qk.profile.mine(userId),
    queryFn: () => getMyWaiterProfile(userId),
  });
}

/** Profilo di un cameriere per id (vista ristoratore sul candidato). */
export function useWaiterProfile(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.profile.byId(waiterId ?? ""),
    queryFn: () => getWaiterProfileById(waiterId as string),
    enabled: !!waiterId,
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
