import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { BADGE_STALE_TIME } from "@/lib/queryClient";
import type { Enums } from "@/types/database";
import {
  APPLICATIONS_PAGE_SIZE,
  cancelMyApplication,
  createApplication,
  getApplications,
  getMyApplication,
  getMyApplicationCounts,
  getMyApplications,
  getMyApplicationsPage,
  getMyServicesCount,
  getMyUpcomingShifts,
  getPendingCount,
  getTodayStaff,
  updateApplicationStatus,
  type ApplicationsFilter,
} from "./api";

/**
 * Candidature di un turno. `enabled` serve perché un turno è `internal` **xor**
 * `marketplace`: la schermata di dettaglio le chiedeva entrambe, quindi una
 * delle due query era sempre a vuoto.
 */
export function useApplications(shiftId: string, enabled = true) {
  return useQuery({
    queryKey: qk.applications.byShift(shiftId),
    queryFn: () => getApplications(shiftId),
    enabled,
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
    staleTime: BADGE_STALE_TIME,
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

/** "Le mie candidature" — scroll infinito con filtro server-side. */
export function useMyApplicationsInfinite(
  waiterId: string | undefined,
  filter: ApplicationsFilter
) {
  return useInfiniteQuery({
    queryKey: qk.applications.pageMine(waiterId ?? "", filter),
    queryFn: ({ pageParam }) =>
      getMyApplicationsPage(waiterId as string, filter, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < APPLICATIONS_PAGE_SIZE ? undefined : allPages.length,
    enabled: !!waiterId,
  });
}

/** Numero di servizi svolti (home professionista): solo il conteggio. */
export function useMyServicesCount(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.servicesCount(waiterId ?? ""),
    queryFn: () => getMyServicesCount(waiterId as string),
    enabled: !!waiterId,
    staleTime: BADGE_STALE_TIME,
  });
}

/** Conteggi per i chip filtro delle candidature. */
export function useMyApplicationCounts(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.applications.counts(waiterId ?? ""),
    queryFn: () => getMyApplicationCounts(waiterId as string),
    enabled: !!waiterId,
  });
}

/** Withdraw a pending application, then refresh every waiter-facing view. */
export function useCancelApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => cancelMyApplication(appId),
    onSuccess: () => {
      // Prefix invalidation covers mineAll/mine/upcoming + pagine e conteggi.
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
      // Prefix: copre mine/mineAll + pagine e conteggi delle candidature.
      qc.invalidateQueries({ queryKey: qk.applications.all });
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
