import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { qk } from "@/lib/queryKeys";

/**
 * Listener realtime app-wide per il dominio turni/organico. Sottoscrive i
 * cambiamenti (filtrati dalla RLS del singolo utente) su shifts, applications,
 * shift_assignments e staff_members e invalida le query React Query, così
 * ristoratore e cameriere vedono i cambiamenti in tempo reale senza ricaricare.
 * Nessuna UI. Deps stabili (userId, qc) → nessun churn del canale.
 */
export function RealtimeSync({ userId }: { userId: string }) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`sync:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        () => {
          qc.invalidateQueries({ queryKey: qk.shifts.all });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => {
          // Le candidature cambiano anche i contatori mostrati sulle card turno.
          qc.invalidateQueries({ queryKey: qk.applications.all });
          qc.invalidateQueries({ queryKey: qk.shifts.all });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_assignments" },
        () => {
          qc.invalidateQueries({ queryKey: qk.assignments.all });
          qc.invalidateQueries({ queryKey: qk.shifts.all });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_members" },
        () => {
          qc.invalidateQueries({ queryKey: qk.staff.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return null;
}
