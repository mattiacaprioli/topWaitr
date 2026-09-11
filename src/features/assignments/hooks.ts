import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { Enums } from "@/types/database";
import { addDaysToDate } from "@/lib/format";
import type { ShiftWithAssignees } from "@/features/shifts/types";
import type { InternalShiftPlan } from "./api";
import {
  createInternalShift,
  createInternalShifts,
  getInternalShiftPlans,
  getMyAssignedUpcoming,
  getMyAssignmentForShift,
  getShiftAssignments,
  getShiftRoleRequirements,
  STAFF_RECENT_SHIFTS,
  getStaffPerformance,
  getStaffWorkedShifts,
  getTodayAssignments,
  getVenueCoverage,
  getVenueHoursSummary,
  reassignShiftAssignment,
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

/** `enabled`: ha senso solo sui turni interni (vedi `useApplications`). */
export function useShiftAssignments(shiftId: string, enabled = true) {
  return useQuery({
    queryKey: qk.assignments.byShift(shiftId),
    queryFn: () => getShiftAssignments(shiftId),
    enabled,
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

/**
 * Riassegna un turno a un'altra persona (trascinamento nella vista per persona
 * del planning). La patch ottimistica scrive `status: "assigned"` perché è così
 * che nascerà la riga vera: chi entra non ha confermato niente.
 *
 * Nota: scambiare un Cameriere con un Barista può far passare la copertura da
 * verde ad arancione. È corretto — `shiftCoverage()` guarda i ruoli — e si vede
 * subito, che è il punto.
 */
export function useReassignShiftAssignment(venueId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      assignmentId: string;
      shiftId: string;
      toStaffMember: { id: string; display_name: string; role: string | null };
    }) => reassignShiftAssignment(vars.assignmentId, vars.toStaffMember.id),

    onMutate: async ({ assignmentId, shiftId, toStaffMember }) => {
      if (!venueId) return;
      const queryKey = qk.shifts.rangeAll(venueId);
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueriesData<ShiftWithAssignees[]>({ queryKey });
      qc.setQueriesData<ShiftWithAssignees[]>({ queryKey }, (rows) =>
        rows?.map((s) =>
          s.id !== shiftId
            ? s
            : {
                ...s,
                shift_assignments: s.shift_assignments.map((a) =>
                  a.id !== assignmentId
                    ? a
                    : {
                        ...a,
                        status: "assigned" as const,
                        staff_member: {
                          id: toStaffMember.id,
                          display_name: toStaffMember.display_name,
                          role: toStaffMember.role,
                          // Lo rimette a posto il refetch: qui serve solo al
                          // conteggio dei destinatari, che non è ancora in gioco.
                          waiter_id: null,
                        },
                      }
                ),
              }
        )
      );
      return { previous };
    },

    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.previous ?? []) {
        qc.setQueryData(key, data);
      }
    },

    onSettled: (_data, _error, { shiftId }) => {
      qc.invalidateQueries({ queryKey: qk.assignments.byShift(shiftId) });
      qc.invalidateQueries({ queryKey: qk.shifts.detail(shiftId) });
      invalidateAfterShiftWrite(qc, venueId);
      // Le statistiche per persona cambiano da entrambi i lati.
      qc.invalidateQueries({ queryKey: qk.staff.all });
    },
  });
}

/** `enabled`: ha senso solo sui turni interni (vedi `useApplications`). */
export function useShiftRoleRequirements(shiftId: string, enabled = true) {
  return useQuery({
    queryKey: qk.assignments.roleReqs(shiftId),
    queryFn: () => getShiftRoleRequirements(shiftId),
    enabled,
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

/** Statistiche aggregate di un membro dell'organico (le calcola il database). */
export function useStaffPerformance(staffMemberId: string | undefined) {
  return useQuery({
    queryKey: qk.assignments.staffPerformance(staffMemberId ?? ""),
    queryFn: () => getStaffPerformance(staffMemberId as string),
    enabled: !!staffMemberId,
  });
}

/** Ultimi turni svolti di un membro, ordinati e limitati dal database. */
export function useStaffWorkedShifts(
  staffMemberId: string | undefined,
  limit = STAFF_RECENT_SHIFTS
) {
  return useQuery({
    queryKey: qk.assignments.staffWorked(staffMemberId ?? "", limit),
    queryFn: () => getStaffWorkedShifts(staffMemberId as string, limit),
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
