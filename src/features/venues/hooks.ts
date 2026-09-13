import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { getMyVenue, saveVenue, updateVenueLogo, type VenueInput } from "./api";

/** Passare `""` come ownerId tiene la query spenta (usato da RealtimeSync per i camerieri). */
export function useMyVenue(ownerId: string) {
  return useQuery({
    queryKey: qk.venues.mine(ownerId),
    queryFn: () => getMyVenue(ownerId),
    enabled: !!ownerId,
  });
}

/**
 * Logo del locale. Invalida solo `venues.mine`: il logo compare anche sulle
 * card turno del professionista, ma quelle sono query sue, su un altro
 * dispositivo — le rivedrà al prossimo caricamento.
 */
export function useUpdateVenueLogo(ownerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { venueId: string; logoUrl: string | null }) =>
      updateVenueLogo(vars.venueId, vars.logoUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.venues.mine(ownerId) });
    },
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
