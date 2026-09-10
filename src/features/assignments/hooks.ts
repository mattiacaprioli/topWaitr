import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { Enums } from "@/types/database";
import { addDaysToDate } from "@/lib/format";
import type { InternalShiftPlan } from "./api";
import {
  createInternalShift,
  createInternalShifts,
  getInternalShiftPlans,
  getMyAssignedUpcoming,
  getMyAssignmentForShift,
  getMyAssignmentHistory,
  getShiftAssignments,
  getShiftRoleRequirements,
  getStaffAssignments,
  getTodayAssignments,
  getVenueCoverage,
  getVenueHoursSummary,
  setAssignmentPresence,
  updateAssignmentStatus,
  updateInternalShift,
} from "./api";

export function useMyAssignedUpcoming(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.assignments.mineUpcoming(waiterId ?? ""),
    queryFn: () => getMyAssignedUpcoming(waiterId as string),
    enabled: !!waiterId,
  });
}

export function useMyAssignmentHistory(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.assignments.mineHistory(waiterId ?? ""),
    queryFn: () => getMyAssignmentHistory(waiterId as string),
    enabled: !!waiterId,
  });
}

export function useMyAssignmentForShift(
  shiftId: string,
  waiterId: string | undefined
) {
  return useQuery({
    queryKey: qk.assignments.mineForShift(shiftId, waiterId ?? ""),
    queryFn: () => getMyAssignmentForShift(shiftId, waiterId as string),
    enabled: !!waiterId,
  });
}

/** Waiter confirms/declines an assignment; refresh every assignment view. */
export function useRespondToAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: Enums<"assignment_status"> }) =>
      updateAssignmentStatus(vars.id, vars.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.assignments.all }),
  });
}

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

/** Viste manager toccate da qualunque creazione di turni interni. */
function invalidateAfterShiftWrite(
  qc: ReturnType<typeof useQueryClient>,
  venueId: string | undefined
) {
  if (venueId) {
    qc.invalidateQueries({ queryKey: qk.shifts.byVenue(venueId) });
    qc.invalidateQueries({ queryKey: qk.shifts.rangeAll(venueId) });
    qc.invalidateQueries({ queryKey: qk.assignments.coverage(venueId) });
  }
  qc.invalidateQueries({ queryKey: qk.assignments.all });
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
      roleTargets?: { role: string; count: number }[];
    }) => createInternalShift({ venue_id: venueId as string, ...input }),
    onSuccess: () => invalidateAfterShiftWrite(qc, venueId),
  });
}

/**
 * Crea **più** turni interni in una volta (es. lo stesso turno su lun-mar-ven).
 * Stesse invalidazioni della creazione singola.
 */
export function useCreateInternalShifts(venueId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plans: InternalShiftPlan[]) =>
      createInternalShifts({ venue_id: venueId as string, plans }),
    onSuccess: () => invalidateAfterShiftWrite(qc, venueId),
  });
}

/**
 * Duplica turni interni esistenti spostandoli di `dayShift` giorni: è il
 * "copia questa settimana su quella dopo" — un click al posto di riscrivere a
 * mano i turni che si ripetono uguali ogni settimana.
 *
 * `withStaff: false` copia la griglia (orari e fabbisogno per ruolo) lasciando
 * i turni da assegnare: utile quando le persone cambiano ma la struttura no, e
 * soprattutto **non manda notifiche a nessuno**.
 */
export function useCopyInternalShifts(venueId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sourceIds: string[];
      dayShift: number;
      withStaff: boolean;
    }) => {
      const plans = await getInternalShiftPlans(input.sourceIds);
      return createInternalShifts({
        venue_id: venueId as string,
        plans: plans.map((p) => ({
          ...p,
          date: addDaysToDate(p.date, input.dayShift),
          staffIds: input.withStaff ? p.staffIds : [],
        })),
      });
    },
    onSuccess: () => invalidateAfterShiftWrite(qc, venueId),
  });
}

/** Modifica completa di un turno interno; aggiorna tutte le viste manager. */
export function useUpdateInternalShift(shiftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateInternalShift>[1]) =>
      updateInternalShift(shiftId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shifts.all });
      qc.invalidateQueries({ queryKey: qk.assignments.all });
    },
  });
}

export function useShiftRoleRequirements(shiftId: string) {
  return useQuery({
    queryKey: qk.assignments.roleReqs(shiftId),
    queryFn: () => getShiftRoleRequirements(shiftId),
  });
}

export function useVenueCoverage(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.assignments.coverage(venueId ?? ""),
    queryFn: () => getVenueCoverage(venueId as string),
    enabled: !!venueId,
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

export function useStaffAssignments(staffMemberId: string | undefined) {
  return useQuery({
    queryKey: qk.assignments.byStaff(staffMemberId ?? ""),
    queryFn: () => getStaffAssignments(staffMemberId as string),
    enabled: !!staffMemberId,
  });
}

export function useVenueHoursSummary(
  venueId: string | undefined,
  month: string
) {
  return useQuery({
    queryKey: qk.staff.hours(venueId ?? "", month),
    queryFn: () => getVenueHoursSummary(venueId as string, month),
    enabled: !!venueId,
  });
}

/** Manager marks presence/hours on a concluded internal shift; refresh views. */
export function useSetAssignmentPresence(shiftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...fields
    }: {
      id: string;
      status?: Enums<"assignment_status">;
      worked_hours?: number | null;
    }) => setAssignmentPresence(id, fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.assignments.byShift(shiftId) });
      qc.invalidateQueries({ queryKey: qk.assignments.all });
      qc.invalidateQueries({ queryKey: qk.staff.all });
    },
  });
}
