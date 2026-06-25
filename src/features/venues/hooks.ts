import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { getMyVenue, saveVenue, type VenueInput } from "./api";

export function useMyVenue(ownerId: string) {
  return useQuery({
    queryKey: qk.venues.mine(ownerId),
    queryFn: () => getMyVenue(ownerId),
  });
}

export function useSaveVenue(ownerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { input: VenueInput; venueId?: string }) =>
      saveVenue(ownerId, vars.input, vars.venueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.venues.mine(ownerId) });
    },
  });
}
