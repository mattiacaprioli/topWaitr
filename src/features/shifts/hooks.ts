import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { Enums, TablesInsert, TablesUpdate } from "@/types/database";
import {
  SHIFTS_PAGE_SIZE,
  createShift,
  getMyShifts,
  getOpenShifts,
  getShift,
  getShiftWithVenue,
  getVenuePastShiftsCount,
  getVenuePastShiftsPage,
  updateShift,
  updateShiftStatus,
} from "./api";

export function useMyShifts(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.shifts.byVenue(venueId ?? ""),
    queryFn: () => getMyShifts(venueId as string),
    enabled: !!venueId,
  });
}

/** Storico turni del locale — scroll infinito. */
export function useVenuePastShifts(venueId: string | undefined) {
  return useInfiniteQuery({
    queryKey: qk.shifts.past(venueId ?? ""),
    queryFn: ({ pageParam }) =>
      getVenuePastShiftsPage(venueId as string, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < SHIFTS_PAGE_SIZE ? undefined : allPages.length,
    enabled: !!venueId,
  });
}

export function useVenuePastShiftsCount(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.shifts.pastCount(venueId ?? ""),
    queryFn: () => getVenuePastShiftsCount(venueId as string),
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

export function useUpdateShift(shiftId: string, venueId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: TablesUpdate<"shifts">) => updateShift(shiftId, fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shifts.detail(shiftId) });
      if (venueId) qc.invalidateQueries({ queryKey: qk.shifts.byVenue(venueId) });
    },
  });
}
