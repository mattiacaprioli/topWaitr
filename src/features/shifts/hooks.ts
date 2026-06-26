import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { Enums, TablesInsert } from "@/types/database";
import {
  createShift,
  getMyShifts,
  getOpenShifts,
  getShift,
  getShiftWithVenue,
  updateShiftStatus,
} from "./api";

export function useMyShifts(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.shifts.byVenue(venueId ?? ""),
    queryFn: () => getMyShifts(venueId as string),
    enabled: !!venueId,
  });
}

/** Waiter feed: open, non-past shifts across all venues. */
export function useOpenShifts() {
  return useQuery({
    queryKey: qk.shifts.open(),
    queryFn: getOpenShifts,
  });
}

export function useShift(id: string) {
  return useQuery({
    queryKey: qk.shifts.detail(id),
    queryFn: () => getShift(id),
  });
}

/** Shift detail joined with its venue (waiter detail view). */
export function useShiftWithVenue(id: string) {
  return useQuery({
    queryKey: qk.shifts.detail(id),
    queryFn: () => getShiftWithVenue(id),
  });
}

export function useCreateShift(venueId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TablesInsert<"shifts">) => createShift(input),
    onSuccess: () => {
      if (venueId) qc.invalidateQueries({ queryKey: qk.shifts.byVenue(venueId) });
    },
  });
}

export function useUpdateShiftStatus(shiftId: string, venueId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: Enums<"shift_status">) =>
      updateShiftStatus(shiftId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shifts.detail(shiftId) });
      if (venueId) qc.invalidateQueries({ queryKey: qk.shifts.byVenue(venueId) });
    },
  });
}
