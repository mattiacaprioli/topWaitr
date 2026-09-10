import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useShift, useVenueShiftsRange } from "@/features/shifts/hooks";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { shiftCoverage } from "@/features/assignments/coverage";
import type { Shift, ShiftWithCoverage } from "@/features/shifts/api";
import { useVenue } from "../lib/venue";
import {
  addDays,
  addMonths,
  dayLabel,
  isSameMonth,
  isToday,
  monthGridDays,
  monthTitle,
  startOfMonth,
  startOfWeek,
  weekDays,
  weekLabel,
  WEEKDAY_NAMES,
} from "../lib/week";
import { Button, PageHeader, Pill, QueryError, Spinner } from "../ui/primitives";
import { ShiftPanel } from "../shifts/ShiftPanel";
import { DuplicateWeekDialog } from "../shifts/DuplicateWeekDialog";

type View = "settimana" | "mese";
const VIEW_KEY = "topwaitr.planning.view";

function storedView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "mese" ? "mese" : "settimana";
  } catch {
    // Private browsing / cookie bloccati: si riparte dal default.
    return "settimana";
  }
}

/**
 * Planning. Due viste sullo stesso dato: la **settimana** per lavorare (celle
 * alte, si legge tutto), il **mese** per vedere la forma del periodo e trovare
 * i giorni scoperti. Entrambe usano `useVenueShiftsRange`, cambia solo
 * l'intervallo richiesto.
 */
export function PlanningPage() {
  const venue = useVenue();
  const [view, setView] = useState<View>(storedView);
  const [monday, setMonday] = useState(() => startOfWeek(new Date()));
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [panel, setPanel] = useState<{ date: string; shift?: Shift } | null>(
    null
  );
  const [duplicating, setDuplicating] = useState(false);

  const [params, setParams] = useSearchParams();
  const deepLinkId = params.get("shift");

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // Preferenza non memorizzabile: pazienza, la vista resta per la sessione.
    }
  }, [view]);

  const days = useMemo(
    () => (view === "settimana" ? weekDays(monday) : monthGridDays(month)),
    [view, monday, month]
  );

  const { data, isPending, isError, error } = useVenueShiftsRange(
    venue.id,
    days[0],
    days[days.length - 1]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, ShiftWithCoverage[]>();
    for (const day of days) map.set(day, []);
    for (const shift of data ?? []) map.get(shift.date)?.push(shift);
    return map;
  }, [data, days]);

  function goToday() {
    setMonday(startOfWeek(new Date()));
    setMonth(startOfMonth(new Date()));
  }

  return (
    <>
      <PageHeader
        title="Planning"
        subtitle={view === "settimana" ? weekLabel(monday) : monthTitle(month)}
        actions={
          <>
            {/* Solo in vista settimana: si duplica una settimana, non un mese —
                copiare 60 turni in un colpo non è un gesto da un click. */}
            {view === "settimana" ? (
              <Button className="mr-2" onClick={() => setDuplicating(true)}>
                Duplica settimana
              </Button>
            ) : null}
            <div className="mr-2 flex overflow-hidden rounded-xl border border-border-2">
              {(["settimana", "mese"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "focus-gold px-3 py-2 text-sm font-semibold capitalize transition",
                    view === v
                      ? "bg-gold text-gold-ink"
                      : "bg-bg-2 text-t2 hover:bg-bg-3"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button
              onClick={() =>
                view === "settimana"
                  ? setMonday((m) => addDays(m, -7))
                  : setMonth((m) => addMonths(m, -1))
              }
            >
              ←
            </Button>
            <Button onClick={goToday}>Oggi</Button>
            <Button
              onClick={() =>
                view === "settimana"
                  ? setMonday((m) => addDays(m, 7))
                  : setMonth((m) => addMonths(m, 1))
              }
            >
              →
            </Button>
          </>
        }
      />

      {isError ? <QueryError error={error} /> : null}
      {isPending ? <Spinner /> : null}

      {view === "settimana" ? (
        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const { name, num } = dayLabel(day);
            const shifts = byDay.get(day) ?? [];
            return (
              <section
                key={day}
                className={cn(
                  "flex min-h-56 flex-col rounded-2xl border bg-bg-card p-2",
                  isToday(day) ? "border-border-gold" : "border-border-2"
                )}
              >
                <header className="mb-2 flex items-baseline justify-between px-1">
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      isToday(day) ? "text-gold" : "text-t3"
                    )}
                  >
                    {name}
                  </span>
                  <span className="font-mono text-sm text-t2">{num}</span>
                </header>

                <div className="flex flex-1 flex-col gap-1.5">
                  {shifts.map((shift) => (
                    <ShiftCell
                      key={shift.id}
                      shift={shift}
                      onOpen={() => setPanel({ date: day, shift })}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setPanel({ date: day })}
                  className="focus-gold mt-1.5 rounded-lg border border-dashed border-border-2 py-1.5 text-xs text-t4 transition hover:border-border-gold hover:text-gold"
                >
                  + Turno
                </button>
              </section>
            );
          })}
        </div>
      ) : (
        <MonthGrid
          days={days}
          month={month}
          byDay={byDay}
          onCreate={(day) => setPanel({ date: day })}
          onOpen={(day, shift) => setPanel({ date: day, shift })}
        />
      )}

      {deepLinkId ? (
        <DeepLinkedShift
          id={deepLinkId}
          onResolved={(shift) => {
            const d = new Date(`${shift.date}T00:00:00`);
            setMonday(startOfWeek(d));
            setMonth(startOfMonth(d));
            setPanel({ date: shift.date, shift });
            setParams({}, { replace: true });
          }}
        />
      ) : null}

      {duplicating ? (
        <DuplicateWeekDialog
          monday={monday}
          shifts={data ?? []}
          onClose={() => setDuplicating(false)}
        />
      ) : null}

      {panel ? (
        <ShiftPanel
          date={panel.date}
          shift={panel.shift}
          onClose={() => setPanel(null)}
        />
      ) : null}
    </>
  );
}

function MonthGrid({
  days,
  month,
  byDay,
  onCreate,
  onOpen,
}: {
  days: string[];
  month: Date;
  byDay: Map<string, ShiftWithCoverage[]>;
  onCreate: (day: string) => void;
  onOpen: (day: string, shift: ShiftWithCoverage) => void;
}) {
  // Nel mese lo spazio per cella è poco: si mostrano i primi tre turni e si
  // conta il resto, invece di comprimerli fino a renderli illeggibili.
  const MAX_VISIBLE = 3;

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-2">
        {WEEKDAY_NAMES.map((n) => (
          <span
            key={n}
            className="px-1 text-xs font-semibold uppercase tracking-wider text-t4"
          >
            {n}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const shifts = byDay.get(day) ?? [];
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const visible = shifts.slice(0, MAX_VISIBLE);
          const hidden = shifts.length - visible.length;

          return (
            <section
              key={day}
              className={cn(
                "group flex min-h-28 flex-col rounded-xl border p-1.5",
                today
                  ? "border-border-gold bg-bg-card"
                  : "border-border-2 bg-bg-card",
                // I giorni fuori mese restano visibili ma arretrano: servono a
                // completare le settimane, non a essere letti.
                !inMonth && "opacity-40"
              )}
            >
              <header className="mb-1 flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "font-mono text-xs",
                    today ? "font-bold text-gold" : "text-t3"
                  )}
                >
                  {day.slice(8)}
                </span>
                <button
                  onClick={() => onCreate(day)}
                  aria-label={`Aggiungi turno il ${day}`}
                  className="focus-gold rounded px-1 text-xs text-t4 opacity-0 transition hover:text-gold group-hover:opacity-100"
                >
                  +
                </button>
              </header>

              <div className="flex flex-1 flex-col gap-1">
                {visible.map((shift) => {
                  const counts = cellCounts(shift);
                  const short =
                    counts.short && shift.status !== "cancelled";
                  return (
                    <button
                      key={shift.id}
                      onClick={() => onOpen(day, shift)}
                      title={`${shift.title} · ${formatTime(shift.start_time)}–${formatTime(shift.end_time)} · ${counts.filled}/${counts.total}`}
                      className={cn(
                        "focus-gold flex items-center gap-1 rounded border-l-2 bg-bg-1 py-0.5 pl-1 pr-0.5 text-left transition hover:bg-bg-2",
                        shift.status === "cancelled"
                          ? "border-l-t4 opacity-50"
                          : short
                            ? "border-l-warning"
                            : "border-l-success"
                      )}
                    >
                      <span className="shrink-0 font-mono text-[10px] text-t4">
                        {formatTime(shift.start_time)}
                      </span>
                      <span
                        className={cn(
                          "truncate text-[11px] text-t1",
                          shift.status === "cancelled" && "line-through"
                        )}
                      >
                        {shift.title}
                      </span>
                    </button>
                  );
                })}
                {hidden > 0 ? (
                  <span className="pl-1 text-[10px] text-t4">
                    +{hidden} altr{hidden === 1 ? "o" : "i"}
                  </span>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-3 flex flex-wrap gap-4 text-xs text-t4">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded bg-success" /> coperto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded bg-warning" /> mancano persone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded bg-t4" /> annullato
        </span>
      </p>
    </div>
  );
}

/**
 * I numeri mostrati sul turno. Per un turno interno con fabbisogno per ruolo
 * vale la **copertura per ruolo**, la stessa della pagina «Copertura»: il
 * conteggio grezzo degli assegnati diceva "1/2" anche quando quella persona
 * copriva un ruolo che non serviva (o aveva rifiutato). Senza fabbisogno, o sul
 * marketplace, restano i posti (`positions_filled`, tenuto dai trigger DB).
 */
function cellCounts(shift: ShiftWithCoverage): {
  filled: number;
  total: number;
  short: boolean;
} {
  const coverage = shiftCoverage(shift);
  const byRole = shift.kind === "internal" && coverage.required > 0;
  const filled = byRole ? coverage.covered : shift.positions_filled;
  const total = byRole ? coverage.required : shift.positions_total;
  return { filled, total, short: filled < total };
}

function ShiftCell({
  shift,
  onOpen,
}: {
  shift: ShiftWithCoverage;
  onOpen: () => void;
}) {
  const internal = shift.kind === "internal";
  const cancelled = shift.status === "cancelled";
  const { filled, total, short } = cellCounts(shift);

  return (
    <button
      onClick={onOpen}
      className={cn(
        "focus-gold rounded-lg border p-2 text-left transition hover:border-border-gold",
        cancelled
          ? "border-border bg-bg-1 opacity-50"
          : "border-border-2 bg-bg-1 hover:bg-bg-2"
      )}
    >
      <p
        className={cn(
          "truncate text-xs font-semibold text-t1",
          cancelled && "line-through"
        )}
      >
        {shift.title}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-t3">
        {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Pill tone={internal ? "neutral" : "gold"}>
          {internal ? "Staff" : "Extra"}
        </Pill>
        {cancelled ? (
          <Pill tone="error">Annullato</Pill>
        ) : (
          <Pill tone={short ? "warning" : "success"}>
            {filled}/{total}
          </Pill>
        )}
      </div>
    </button>
  );
}

/** Carica un turno per id e lo consegna una volta sola. Nessuna UI. */
function DeepLinkedShift({
  id,
  onResolved,
}: {
  id: string;
  onResolved: (shift: Shift) => void;
}) {
  const { data } = useShift(id);
  useEffect(() => {
    if (data) onResolved(data);
    // `onResolved` azzera il parametro che smonta questo componente: non serve
    // (né si vuole) rieseguire l'effetto se l'identità della callback cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  return null;
}
