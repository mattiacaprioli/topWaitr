import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { Enums } from "@/types/database";
import { updateShiftPositions } from "@/features/shifts/api";
import { getApplications, updateApplicationStatus } from "./api";

export function useApplications(shiftId: string) {
  return useQuery({
    queryKey: qk.applications.byShift(shiftId),
    queryFn: () => getApplications(shiftId),
  });
}

/**
 * Accept/reject an application, then keep shifts.positions_filled in sync with
 * the count of accepted applications. Invalidates both the application list and
 * the shift detail so the UI reflects the new counts.
 */
export function useApplicationDecision(shiftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      appId: string;
      status: Enums<"application_status">;
    }) => {
      await updateApplicationStatus(vars.appId, vars.status);
      const apps = await getApplications(shiftId);
      const accepted = apps.filter((a) => a.status === "accepted").length;
      await updateShiftPositions(shiftId, accepted);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.applications.byShift(shiftId) });
      qc.invalidateQueries({ queryKey: qk.shifts.detail(shiftId) });
    },
  });
}
