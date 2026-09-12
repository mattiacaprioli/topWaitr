import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  archiveVenueRole,
  createVenueRole,
  getStaffMemberRoles,
  getVenueRoles,
  renameVenueRole,
  setStaffMemberRoles,
} from "./api";

/**
 * Ogni scrittura sui ruoli tocca anche organico e turni: le schede staff
 * mostrano i ruoli della persona e la copertura mostra il nome del fabbisogno.
 * Senza queste invalidazioni un ruolo rinominato resterebbe col nome vecchio
 * nella metà delle schermate.
 */
function useRolesInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.roles.all });
    qc.invalidateQueries({ queryKey: qk.staff.all });
    qc.invalidateQueries({ queryKey: qk.assignments.all });
    qc.invalidateQueries({ queryKey: qk.shifts.all });
  };
}

export function useVenueRoles(venueId: string | undefined) {
  return useQuery({
    queryKey: qk.roles.byVenue(venueId ?? ""),
    queryFn: () => getVenueRoles(venueId as string),
    enabled: !!venueId,
  });
}

export function useStaffMemberRoles(staffMemberId: string | undefined) {
  return useQuery({
    queryKey: qk.roles.byStaffMember(staffMemberId ?? ""),
    queryFn: () => getStaffMemberRoles(staffMemberId as string),
    enabled: !!staffMemberId,
  });
}

export function useCreateVenueRole() {
  const invalidate = useRolesInvalidation();
  return useMutation({
    mutationFn: (vars: { venueId: string; name: string }) =>
      createVenueRole(vars.venueId, vars.name),
    onSuccess: invalidate,
  });
}

export function useRenameVenueRole() {
  const invalidate = useRolesInvalidation();
  return useMutation({
    mutationFn: (vars: { id: string; name: string }) =>
      renameVenueRole(vars.id, vars.name),
    onSuccess: invalidate,
  });
}

export function useArchiveVenueRole() {
  const invalidate = useRolesInvalidation();
  return useMutation({
    mutationFn: (id: string) => archiveVenueRole(id),
    onSuccess: invalidate,
  });
}

export function useSetStaffMemberRoles() {
  const invalidate = useRolesInvalidation();
  return useMutation({
    mutationFn: (vars: { staffMemberId: string; roleIds: string[] }) =>
      setStaffMemberRoles(vars.staffMemberId, vars.roleIds),
    onSuccess: invalidate,
  });
}
