import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { Enums } from "@/types/database";
import {
  cancelMyApplication,
  createApplication,
  getApplications,
  getMyApplication,
  getMyApplications,
  getMyApplicationsWithShift,
  getMyUpcomingShifts,
  getPendingCount,
  getTodayStaff,
  updateApplicationStatus,
} from "./api";

export function useApplications(shiftId: string) {
  return useQuery({
    queryKey: qk.applications.byShift(shiftId),
    queryFn: () => getApplications(shiftId),
  });
}

/** Manager dashboard: waiters accepted on today's shifts for the venue. */
export function useTodayStaff(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.todayStaff(venueId ?? ""),
    queryFn: () => getTodayStaff(venueId as string),
    enabled: !!venueId,
  });
}

/** Manager dashboard: pending applications count for the venue. */
export function usePendingCount(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.pendingByVenue(venueId ?? ""),
    queryFn: () => getPendingCount(venueId as string),
    enabled: !!venueId,
  });
}

/** The waiter's own application for a shift (to gate the apply form). */
export function useMyApplication(shiftId: string, waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.mine(shiftId, waiterId ?? ""),
    queryFn: () => getMyApplication(shiftId, waiterId as string),
    enabled: !!waiterId,
  });
}

/** All of the waiter's applications (gates the inline CTA across the shift list). */
export function useMyApplications(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.mineAll(waiterId ?? ""),
    queryFn: () => getMyApplications(waiterId as string),
    enabled: !!waiterId,
  });
}

/** The waiter's accepted, upcoming shifts (Home dashboard). */
export function useMyUpcomingShifts(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.upcoming(waiterId ?? ""),
    queryFn: () => getMyUpcomingShifts(waiterId as string),
    enabled: !!waiterId,
  });
}

/** The waiter's applications with shift/venue, every status ("Le mie candidature"). */
export function useMyApplicationsList(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.mineList(waiterId ?? ""),
    queryFn: () => getMyApplicationsWithShift(waiterId as string),
    enabled: !!waiterId,
  });
}

/** Withdraw a pending application, then refresh every waiter-facing view. */
export function useCancelApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => cancelMyApplication(appId),
    onSuccess: () => {
      // Prefix invalidation covers mineList/mineAll/mine/upcoming.
      qc.invalidateQueries({ queryKey: qk.applications.all });
      qc.invalidateQueries({ queryKey: qk.shifts.open() });
    },
  });
}

/** Submit an application for a shift, then refresh the waiter's views. */
export function useApply(shiftId: string, waiterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message?: string) =>
      createApplication({ shift_id: shiftId, waiter_id: waiterId, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.applications.mine(shiftId, waiterId) });
      qc.invalidateQueries({ queryKey: qk.applications.mineAll(waiterId) });
      qc.invalidateQueries({ queryKey: qk.shifts.open() });
    },
  });
}

/**
 * Accept/reject an application. shifts.positions_filled is kept in sync by the
 * DB trigger `applications_sync_positions` (see migration
 * 20260625225437_sync_positions_filled.sql), so we only flip the status here and
 * invalidate the views that show the new counts (application list, shift detail,
 * and the waiter's open-shifts list with its residual positions).
 */
export function useApplicationDecision(shiftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      appId: string;
      status: Enums<"application_status">;
    }) => updateApplicationStatus(vars.appId, vars.status),
    onSuccess: () => {
      // Prefix invalidation also refreshes the manager dashboard's
      // todayStaff/pendingByVenue counters (they live under applications.*).
      qc.invalidateQueries({ queryKey: qk.applications.all });
      qc.invalidateQueries({ queryKey: qk.shifts.detail(shiftId) });
      qc.invalidateQueries({ queryKey: qk.shifts.open() });
    },
  });
}
