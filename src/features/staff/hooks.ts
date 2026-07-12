import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import {
  addStaffMember,
  getStaffMember,
  getVenueStaff,
  getWorkedWithWaiters,
  removeStaffMember,
  updateStaffMember,
} from "./api";

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
