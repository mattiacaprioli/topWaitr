import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import {
  addStaffMember,
  findWaiterByEmail,
  getMyEmployers,
  getMyPendingInvites,
  getStaffMember,
  getVenueStaff,
  getWorkedWithWaiters,
  leaveVenue,
  removeStaffMember,
  respondToInvite,
  updateStaffMember,
} from "./api";

/** Waiter: the venues where they are confirmed staff ("I tuoi locali"). */
export function useMyEmployers(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.staff.employers(waiterId ?? ""),
    queryFn: () => getMyEmployers(waiterId as string),
    enabled: !!waiterId,
  });
}

export function useVenueStaff(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.staff.byVenue(venueId ?? ""),
    queryFn: () => getVenueStaff(venueId as string),
    enabled: !!venueId,
  });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: [...qk.staff.all, "detail", id] as const,
    queryFn: () => getStaffMember(id),
  });
}

export function useWorkedWithWaiters(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.staff.workedWith(venueId ?? ""),
    queryFn: () => getWorkedWithWaiters(venueId as string),
    enabled: !!venueId,
  });
}

export function useAddStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TablesInsert<"staff_members">) => addStaffMember(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.staff.all }),
  });
}

export function useUpdateStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; fields: TablesUpdate<"staff_members"> }) =>
      updateStaffMember(vars.id, vars.fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.staff.all }),
  });
}

export function useRemoveStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeStaffMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.staff.all }),
  });
}

/** Manager: search a waiter by exact email (on-demand). */
export function useFindWaiterByEmail() {
  return useMutation({
    mutationFn: (email: string) => findWaiterByEmail(email),
  });
}

/** Waiter: their pending staff invites. */
export function useMyPendingInvites(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.staff.invites(waiterId ?? ""),
    queryFn: () => getMyPendingInvites(waiterId as string),
    enabled: !!waiterId,
  });
}

/** Waiter: accept/decline a staff invite, then refresh invites + notifications. */
export function useRespondToInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { staffId: string; accept: boolean }) =>
      respondToInvite(vars.staffId, vars.accept),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.staff.all });
      qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}

/** Waiter: resign from a venue's staff, then refresh "I tuoi locali" + assignments. */
export function useLeaveVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => leaveVenue(staffId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.staff.all });
      qc.invalidateQueries({ queryKey: qk.assignments.all });
    },
  });
}
