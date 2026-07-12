import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { Enums } from "@/types/database";
import {
  createInternalShift,
  getShiftAssignments,
  getTodayAssignments,
  updateAssignmentStatus,
} from "./api";

export function useShiftAssignments(shiftId: string) {
  return useQuery({
    queryKey: qk.assignments.byShift(shiftId),
    queryFn: () => getShiftAssignments(shiftId),
  });
}

export function useTodayAssignments(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.assignments.today(venueId ?? ""),
    queryFn: () => getTodayAssignments(venueId as string),
    enabled: !!venueId,
  });
}

/** Create an internal shift + assignments, then refresh the manager's views. */
export function useCreateInternalShift(venueId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      date: string;
      start_time: string;
      end_time: string;
      description: string | null;
      staffIds: string[];
    }) => createInternalShift({ venue_id: venueId as string, ...input }),
    onSuccess: () => {
      if (venueId) qc.invalidateQueries({ queryKey: qk.shifts.byVenue(venueId) });
      qc.invalidateQueries({ queryKey: qk.assignments.all });
    },
  });
}

export function useUpdateAssignmentStatus(shiftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: Enums<"assignment_status"> }) =>
      updateAssignmentStatus(vars.id, vars.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.assignments.byShift(shiftId) });
      qc.invalidateQueries({ queryKey: qk.assignments.all });
    },
  });
}
