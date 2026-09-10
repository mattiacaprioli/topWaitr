import {
  useSetAssignmentPresence,
  useShiftAssignments,
} from "@/features/assignments/hooks";
import { assignmentHours } from "@/features/assignments/hours";
import { shiftDurationHours } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Input, Spinner } from "../ui/primitives";

/**
 * Presenze e ore effettive di un turno concluso.
 *
 * Sta qui e non nella pagina Ore perché è qui che i dati vivono già
 * (`useShiftAssignments`): la pagina Ore aggrega per persona sul mese e non
 * conosce le singole assegnazioni. Su desktop l'ora è un campo numerico —
 * molto più veloce degli step ±0,5h dell'app.
 */
export function PresenceSection({
  shiftId,
  startTime,
  endTime,
}: {
  shiftId: string;
  startTime: string;
  endTime: string;
}) {
  const { data, isPending } = useShiftAssignments(shiftId);
  const presence = useSetAssignmentPresence(shiftId);
  const planned = shiftDurationHours(startTime, endTime);

  if (isPending) return <Spinner label="Caricamento presenze…" />;
  if (!data || data.length === 0) return null;

  return (
    <section>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-t3">
        Presenze e ore
      </span>
      <div className="flex flex-col gap-1">
        {data.map((a) => {
          const absent = a.status === "no_show";
          const hours = assignmentHours(a.status, a.worked_hours, {
            start_time: startTime,
            end_time: endTime,
          });
          return (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-xl border border-border-2 bg-bg-1 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-t1">
                {a.staff_member?.display_name ?? "—"}
              </span>

              <button
                type="button"
                onClick={() =>
                  presence.mutate({
                    id: a.id,
                    status: absent ? "confirmed" : "no_show",
                    // Rientrando da un'assenza si torna alla durata pianificata.
                    worked_hours: absent ? null : a.worked_hours,
                  })
                }
                className={cn(
                  "focus-gold rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                  absent
                    ? "border-error/40 bg-error/10 text-error"
                    : "border-success/40 bg-success/10 text-success"
                )}
              >
                {absent ? "Assente" : "Presente"}
              </button>

              <Input
                type="number"
                step={0.5}
                min={0}
                max={24}
                disabled={absent}
                value={absent ? "" : hours}
                onChange={(e) => {
                  const v = e.target.value;
                  presence.mutate({
                    id: a.id,
                    // Campo svuotato → torna alla durata pianificata (null).
                    worked_hours: v === "" ? null : Number(v),
                  });
                }}
                className="w-20 px-2 py-1 text-center font-mono text-xs disabled:opacity-40"
                aria-label="Ore effettive"
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-t4">
        Durata pianificata {planned.toString().replace(".", ",")} h. Lascia il
        campo vuoto per usarla; scrivi un numero solo se le ore sono diverse.
      </p>
      {presence.isError ? (
        <p className="mt-2 text-xs text-error">{presence.error.message}</p>
      ) : null}
    </section>
  );
}
