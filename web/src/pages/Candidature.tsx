import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMyShifts } from "@/features/shifts/hooks";
import {
  useApplicationDecision,
  useApplications,
} from "@/features/applications/hooks";
import { formatDate, formatRate, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useVenue } from "../lib/venue";
import {
  Button,
  Card,
  PageHeader,
  Pill,
  Placeholder,
  QueryError,
  Spinner,
} from "../ui/primitives";

/**
 * Candidature ai turni marketplace. Due colonne: i turni pubblicati a sinistra,
 * chi si è candidato a quello selezionato a destra — così si decide senza
 * rimbalzare avanti e indietro come sul telefono.
 */
export function CandidaturePage() {
  const venue = useVenue();
  const { data, isPending, isError, error } = useMyShifts(venue.id);
  const [selected, setSelected] = useState<string | null>(null);

  // Solo marketplace: i turni interni non hanno candidature.
  const shifts = useMemo(
    () =>
      (data ?? []).filter(
        (s) => s.kind === "marketplace" && s.status !== "cancelled"
      ),
    [data]
  );

  const current = selected ?? shifts[0]?.id ?? null;

  if (isPending) return <Spinner />;
  if (isError) return <QueryError error={error} />;

  return (
    <>
      <PageHeader
        title="Candidature"
        subtitle="Turni extra pubblicati sul marketplace"
      />

      {shifts.length === 0 ? (
        <Placeholder
          title="Nessun turno extra in programma"
          detail="Quando ti serve una persona in più oltre al tuo staff, pubblica un turno extra dal Planning: le candidature arrivano qui."
        />
      ) : (
        <div className="grid grid-cols-[18rem_1fr] gap-6">
          <div className="flex flex-col gap-2">
            {shifts.map((shift) => {
              const count = shift.applications?.[0]?.count ?? 0;
              const active = shift.id === current;
              return (
                <button
                  key={shift.id}
                  onClick={() => setSelected(shift.id)}
                  className={cn(
                    "focus-gold rounded-2xl border p-3 text-left transition",
                    active
                      ? "border-border-gold bg-gold/10"
                      : "border-border-2 bg-bg-card hover:bg-bg-1"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-t1">
                      {shift.title}
                    </span>
                    {count > 0 ? <Pill tone="gold">{count}</Pill> : null}
                  </div>
                  <p className="mt-1 text-xs text-t3">
                    {formatDate(shift.date)} ·{" "}
                    <span className="font-mono">
                      {formatTime(shift.start_time)}–
                      {formatTime(shift.end_time)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-t4">
                    {shift.positions_filled}/{shift.positions_total} coperti ·{" "}
                    {formatRate(shift.hourly_rate)}
                  </p>
                </button>
              );
            })}
          </div>

          {current ? <ApplicationList shiftId={current} /> : null}
        </div>
      )}
    </>
  );
}

function ApplicationList({ shiftId }: { shiftId: string }) {
  const { data, isPending, isError, error } = useApplications(shiftId);
  const decide = useApplicationDecision(shiftId);

  if (isPending) return <Spinner />;
  if (isError) return <QueryError error={error} />;

  const apps = data ?? [];
  if (apps.length === 0) {
    return (
      <Placeholder
        title="Ancora nessuna candidatura"
        detail="Quando un professionista si candida lo trovi qui, con il suo profilo e la sua reputazione."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {apps.map((app) => {
        const wp = app.waiter?.waiter_profile;
        return (
          <Card key={app.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-48 flex-1">
              {/* Il nome apre il profilo pubblico: la reputazione è il dato su
                  cui si decide, e qui ne sta solo la sintesi. */}
              {app.waiter_id ? (
                <Link
                  to={`/professionista/${app.waiter_id}`}
                  className="focus-gold text-sm font-semibold text-t1 underline decoration-border-gold decoration-2 underline-offset-4 hover:text-gold"
                >
                  {app.waiter?.full_name ?? "Professionista"}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-t1">
                  {app.waiter?.full_name ?? "Professionista"}
                </p>
              )}
              <p className="mt-0.5 text-xs text-t3">
                {wp?.primary_role ?? "Ruolo non indicato"}
                {wp?.years_experience
                  ? ` · ${wp.years_experience} anni di esperienza`
                  : ""}
              </p>
              {/* La reputazione viene dai clienti finali: è il dato che pesa
                  di più nella decisione. */}
              {wp && wp.rating_count > 0 ? (
                <p className="mt-1 font-mono text-xs text-gold">
                  ★ {wp.rating_avg.toFixed(1)}{" "}
                  <span className="text-t4">
                    ({wp.rating_count} recension
                    {wp.rating_count === 1 ? "e" : "i"})
                  </span>
                </p>
              ) : null}
              {app.message ? (
                <p className="mt-2 max-w-lg text-xs leading-5 text-t2">
                  «{app.message}»
                </p>
              ) : null}
            </div>

            {app.status === "pending" ? (
              <div className="flex gap-2">
                <Button
                  variant="gold"
                  disabled={decide.isPending}
                  onClick={() =>
                    decide.mutate({ appId: app.id, status: "accepted" })
                  }
                >
                  Accetta
                </Button>
                <Button
                  disabled={decide.isPending}
                  onClick={() =>
                    decide.mutate({ appId: app.id, status: "rejected" })
                  }
                >
                  Rifiuta
                </Button>
              </div>
            ) : (
              <Pill
                tone={
                  app.status === "accepted"
                    ? "success"
                    : app.status === "rejected"
                      ? "error"
                      : "neutral"
                }
              >
                {app.status === "accepted"
                  ? "Accettata"
                  : app.status === "rejected"
                    ? "Rifiutata"
                    : "Ritirata"}
              </Pill>
            )}
          </Card>
        );
      })}
      {decide.isError ? (
        <p className="text-xs text-error">{decide.error.message}</p>
      ) : null}
    </div>
  );
}
