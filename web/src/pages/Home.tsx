import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMyShifts, useVenuePastShiftsCount } from "@/features/shifts/hooks";
import {
  usePendingCount,
  useTodayStaff,
} from "@/features/applications/hooks";
import { useTodayAssignments } from "@/features/assignments/hooks";
import { formatDate, formatTime, toDateString } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useVenue } from "../lib/venue";
import { Card, PageHeader, Pill, Placeholder } from "../ui/primitives";

type Worker = {
  key: string;
  name: string;
  role: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  start: string;
  end: string;
};

/**
 * Vista d'insieme del locale. Le definizioni dei KPI sono le stesse della home
 * dell'app — se divergessero, gli stessi numeri direbbero cose diverse sui due
 * schermi.
 */
export function HomePage() {
  const venue = useVenue();
  const navigate = useNavigate();

  const shifts = useMyShifts(venue.id).data ?? [];
  const pastCount = useVenuePastShiftsCount(venue.id).data ?? 0;
  const pending = usePendingCount(venue.id).data ?? 0;
  const todayStaff = useTodayStaff(venue.id).data ?? [];
  const todayAssignments = useTodayAssignments(venue.id).data ?? [];

  const today = toDateString(new Date());
  const upcoming = shifts.filter((s) => s.date >= today);
  const openCount = upcoming.filter(
    (s) => s.kind === "marketplace" && s.status === "open"
  ).length;
  // Gli annullati non hanno posti da coprire: esclusi dal KPI.
  const activeUpcoming = upcoming.filter((s) => s.status !== "cancelled");
  const filled = activeUpcoming.reduce((n, s) => n + s.positions_filled, 0);
  const totalPos = activeUpcoming.reduce((n, s) => n + s.positions_total, 0);

  // "Chi lavora oggi": staff assegnato ai turni interni + professionisti
  // accettati sui turni marketplace di oggi, in un'unica lista.
  const workers = useMemo<Worker[]>(
    () => [
      ...todayAssignments.map((a) => ({
        key: `asg-${a.id}`,
        name: a.staff_member?.display_name ?? "Staff",
        role: a.staff_member?.role ?? null,
        ratingAvg: a.staff_member?.waiter?.waiter_profile?.rating_avg ?? null,
        ratingCount:
          a.staff_member?.waiter?.waiter_profile?.rating_count ?? null,
        start: a.shift?.start_time ?? "",
        end: a.shift?.end_time ?? "",
      })),
      ...todayStaff.map((row) => ({
        key: `app-${row.id}`,
        name: row.waiter?.full_name ?? "Professionista",
        role: row.waiter?.waiter_profile?.primary_role ?? null,
        ratingAvg: row.waiter?.waiter_profile?.rating_avg ?? null,
        ratingCount: row.waiter?.waiter_profile?.rating_count ?? null,
        start: row.shift?.start_time ?? "",
        end: row.shift?.end_time ?? "",
      })),
    ],
    [todayAssignments, todayStaff]
  );

  const nextShifts = activeUpcoming.slice(0, 5);

  return (
    <>
      <PageHeader title={venue.name} subtitle="Come sta andando il locale" />

      <div className="mb-6 grid grid-cols-4 gap-3">
        <Stat value={openCount} label="turni extra aperti" />
        <Stat
          value={`${filled}/${totalPos}`}
          label="posti coperti"
          tone={totalPos > 0 && filled < totalPos ? "warning" : "normal"}
        />
        <Stat
          value={pending}
          label="candidature da valutare"
          tone={pending > 0 ? "gold" : "normal"}
          onClick={pending > 0 ? () => navigate("/candidature") : undefined}
        />
        <Stat value={pastCount} label="turni svolti" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-t3">
            Chi lavora oggi {workers.length > 0 ? `· ${workers.length}` : ""}
          </h2>
          {workers.length === 0 ? (
            <Placeholder
              title="Oggi non lavora nessuno"
              detail="Nessun turno assegnato per la giornata di oggi."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {workers.map((w) => (
                <Card
                  key={w.key}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-t1">
                      {w.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-t4">
                      {w.role ?? "Ruolo non indicato"}
                      {w.ratingCount ? (
                        <span className="ml-2 text-gold">
                          ★ {w.ratingAvg?.toFixed(1)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-t2">
                    {w.start ? formatTime(w.start) : "—"}
                    {w.end ? `–${formatTime(w.end)}` : ""}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-t3">
            Prossimi turni
          </h2>
          {nextShifts.length === 0 ? (
            <Placeholder
              title="Nessun turno in programma"
              detail="Crea il primo turno dal Planning."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {nextShifts.map((s) => {
                const short = s.positions_filled < s.positions_total;
                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/planning?shift=${s.id}`)}
                    className="focus-gold rounded-2xl border border-border-2 bg-bg-card p-3 text-left transition hover:border-border-gold hover:bg-bg-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-t1">
                        {s.title}
                      </span>
                      <Pill tone={short ? "warning" : "success"}>
                        {s.positions_filled}/{s.positions_total}
                      </Pill>
                    </div>
                    <p className="mt-1 text-xs text-t3">
                      {formatDate(s.date)} ·{" "}
                      <span className="font-mono">
                        {formatTime(s.start_time)}–{formatTime(s.end_time)}
                      </span>
                      <span className="ml-2 text-t4">
                        {s.kind === "internal" ? "Staff" : "Extra"}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({
  value,
  label,
  tone = "normal",
  onClick,
}: {
  value: string | number;
  label: string;
  tone?: "normal" | "gold" | "warning";
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border-2 bg-bg-card p-4 text-left",
        onClick && "focus-gold transition hover:border-border-gold"
      )}
    >
      <p
        className={cn(
          "font-mono text-3xl",
          tone === "gold" && "text-gold",
          tone === "warning" && "text-warning",
          tone === "normal" && "text-t1"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-t3">{label}</p>
    </Tag>
  );
}
