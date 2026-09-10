import { useMemo } from "react";
import { useVenueCoverage } from "@/features/assignments/hooks";
import { computeCoverage } from "@/features/assignments/coverage";
import { formatDate, formatTime } from "@/lib/format";
import type { CoverageShift } from "@/features/assignments/api";
import { useVenue } from "../lib/venue";
import {
  Card,
  PageHeader,
  Pill,
  Placeholder,
  QueryError,
  Spinner,
} from "../ui/primitives";

/**
 * Turni interni futuri e quanto manca per coprirli, per ruolo. Su desktop si
 * vede tutto insieme: è la vista che dice "giovedì mi manca un cuoco".
 */
export function CoperturaPage() {
  const venue = useVenue();
  const { data, isPending, isError, error } = useVenueCoverage(venue.id);

  const byDay = useMemo(() => {
    const map = new Map<string, CoverageShift[]>();
    for (const shift of data ?? []) {
      const list = map.get(shift.date) ?? [];
      list.push(shift);
      map.set(shift.date, list);
    }
    return [...map.entries()];
  }, [data]);

  const totalMissing = useMemo(
    () =>
      (data ?? []).reduce((sum, s) => {
        const c = computeCoverage(
          s.shift_role_requirements,
          s.shift_assignments.map((a) => ({
            status: a.status,
            role: a.staff_member?.role ?? null,
          }))
        );
        return sum + c.missing;
      }, 0),
    [data]
  );

  if (isPending) return <Spinner />;
  if (isError) return <QueryError error={error} />;

  return (
    <>
      <PageHeader
        title="Copertura"
        subtitle={
          totalMissing > 0
            ? `Mancano ${totalMissing} persone sui turni in programma.`
            : "Tutti i turni in programma sono coperti."
        }
      />

      {byDay.length === 0 ? (
        <Placeholder
          title="Nessun turno interno in programma"
          detail="La copertura si calcola sui turni che organizzi con il tuo staff. Creane uno dal Planning."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {byDay.map(([date, shifts]) => (
            <section key={date}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-t3">
                {formatDate(date)}
              </h2>
              <div className="flex flex-col gap-2">
                {shifts.map((shift) => (
                  <CoverageRow key={shift.id} shift={shift} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function CoverageRow({ shift }: { shift: CoverageShift }) {
  const coverage = computeCoverage(
    shift.shift_role_requirements,
    shift.shift_assignments.map((a) => ({
      status: a.status,
      role: a.staff_member?.role ?? null,
    }))
  );

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-48">
        <p className="text-sm font-semibold text-t1">{shift.title}</p>
        <p className="mt-0.5 font-mono text-xs text-t3">
          {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
        </p>
      </div>

      <div className="flex flex-1 flex-wrap gap-2">
        {coverage.rows.length === 0 ? (
          <span className="text-xs text-t4">
            Nessun fabbisogno per ruolo impostato
          </span>
        ) : (
          coverage.rows.map((row) => {
            const short = row.covered < row.required;
            return (
              <span
                key={row.role}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border-2 bg-bg-1 px-2.5 py-1"
              >
                <span className="text-xs text-t2">{row.role}</span>
                <span
                  className={`font-mono text-xs ${short ? "text-warning" : "text-success"}`}
                >
                  {row.covered}/{row.required}
                </span>
              </span>
            );
          })
        )}
      </div>

      <Pill tone={coverage.missing > 0 ? "warning" : "success"}>
        {coverage.missing > 0 ? `Manca ${coverage.missing}` : "Coperto"}
      </Pill>
    </Card>
  );
}
