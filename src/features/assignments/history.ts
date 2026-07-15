import { useMemo } from "react";
import { shiftDurationHours } from "@/lib/format";
import { useMyApplicationsList } from "@/features/applications/hooks";
import { useMyAssignmentHistory } from "./hooks";
import { assignmentHours, isWorked } from "./hours";

export type WorkHistoryItem = {
  key: string;
  venueName: string;
  logoUrl: string | null;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  kind: "staff" | "marketplace";
};

/**
 * Storico dei turni svolti dal cameriere: assegnazioni interne passate (non
 * rifiutate/assenti) + candidature marketplace accettate ormai passate. Solo ore
 * lavorate, nessun dato economico.
 */
export function useMyWorkHistory(waiterId: string) {
  const assignmentsQ = useMyAssignmentHistory(waiterId);
  const appsQ = useMyApplicationsList(waiterId);
  const today = new Date().toISOString().slice(0, 10);

  const items = useMemo<WorkHistoryItem[]>(() => {
    const fromAssign: WorkHistoryItem[] = (assignmentsQ.data ?? [])
      .filter((a) => a.shift != null && isWorked(a.status))
      .map((a) => ({
        key: `asg-${a.id}`,
        venueName: a.shift!.venue?.name ?? "Locale",
        logoUrl: a.shift!.venue?.logo_url ?? null,
        title: a.shift!.title,
        date: a.shift!.date,
        start_time: a.shift!.start_time,
        end_time: a.shift!.end_time,
        hours: assignmentHours(a.status, a.worked_hours, a.shift!),
        kind: "staff",
      }));
    const fromApps: WorkHistoryItem[] = (appsQ.data ?? [])
      .filter(
        (a) => a.status === "accepted" && a.shift != null && a.shift.date < today
      )
      .map((a) => ({
        key: `app-${a.id}`,
        venueName: a.shift!.venue?.name ?? "Locale",
        logoUrl: a.shift!.venue?.logo_url ?? null,
        title: a.shift!.title,
        date: a.shift!.date,
        start_time: a.shift!.start_time,
        end_time: a.shift!.end_time,
        hours: shiftDurationHours(a.shift!.start_time, a.shift!.end_time),
        kind: "marketplace",
      }));
    return [...fromAssign, ...fromApps].sort((x, y) =>
      y.date.localeCompare(x.date)
    );
  }, [assignmentsQ.data, appsQ.data, today]);

  const totalHours = items.reduce((sum, i) => sum + i.hours, 0);

  return {
    items,
    totalHours,
    count: items.length,
    isLoading: assignmentsQ.isLoading || appsQ.isLoading,
    isError: assignmentsQ.isError || appsQ.isError,
    refetch: () => {
      assignmentsQ.refetch();
      appsQ.refetch();
    },
  };
}
