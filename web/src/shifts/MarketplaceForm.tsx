import { useState } from "react";
import {
  EXTRA_SHIFT_BADGES,
  EXTRA_SHIFT_ROLES,
  RATE_MAX,
  RATE_MIN,
} from "@/features/shifts/extraShiftOptions";
import { useCreateShift, useUpdateShift } from "@/features/shifts/hooks";
import { formatEuro, shiftDurationHours } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Shift } from "@/features/shifts/api";
import { useVenue } from "../lib/venue";
import { Button, Field, Input, Select, Textarea } from "../ui/primitives";

/**
 * "Cerco un extra": crea o modifica un turno marketplace. Ruoli, requisiti e
 * limiti della paga vengono da `extraShiftOptions`, condiviso con il form
 * dell'app — due liste diverse produrrebbero turni incoerenti sullo stesso feed.
 */
export function MarketplaceForm({
  date,
  shift,
  onClose,
}: {
  date: string;
  shift?: Shift;
  onClose: () => void;
}) {
  const venue = useVenue();
  const create = useCreateShift(venue.id);
  const update = useUpdateShift(shift?.id ?? "", venue.id);

  const [role, setRole] = useState<string>(shift?.title ?? EXTRA_SHIFT_ROLES[0]);
  const [day, setDay] = useState(shift?.date ?? date);
  const [start, setStart] = useState(shift?.start_time?.slice(0, 5) ?? "19:00");
  const [end, setEnd] = useState(shift?.end_time?.slice(0, 5) ?? "23:00");
  const [rate, setRate] = useState(shift?.hourly_rate ?? 12);
  const [positions, setPositions] = useState(shift?.positions_total ?? 1);
  const [badges, setBadges] = useState<Set<string>>(
    new Set(shift?.requirements ?? [])
  );
  const [note, setNote] = useState(shift?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const hours = end > start ? shiftDurationHours(start, end) : 0;
  const total = Math.round(rate * hours);

  function toggleBadge(b: string) {
    setBadges((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }

  function onSubmit() {
    if (end <= start) {
      setError("L'orario di fine deve essere dopo l'inizio.");
      return;
    }
    setError(null);
    const fields = {
      title: role,
      date: day,
      start_time: start,
      end_time: end,
      positions_total: Math.max(1, positions),
      hourly_rate: rate,
      description: note.trim() || null,
      requirements: badges.size ? [...badges] : null,
    };
    if (shift) {
      update.mutate(fields, { onSuccess: onClose });
    } else {
      create.mutate(
        { ...fields, venue_id: venue.id, kind: "marketplace", dress_code: null },
        { onSuccess: onClose }
      );
    }
  }

  const pending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ruolo cercato">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {EXTRA_SHIFT_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Persone">
          <Input
            type="number"
            min={1}
            max={20}
            value={positions}
            onChange={(e) =>
              setPositions(Math.max(1, Number(e.target.value) || 1))
            }
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Data">
          <Input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </Field>
        <Field label="Inizio">
          <Input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="Fine">
          <Input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-t3">
            Paga oraria
          </span>
          <span className="font-mono text-sm text-gold">
            {formatEuro(rate)}/h
          </span>
        </div>
        <input
          type="range"
          min={RATE_MIN}
          max={RATE_MAX}
          step={1}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="w-full accent-[var(--color-gold)]"
        />
        {hours > 0 ? (
          <p className="mt-1.5 text-xs text-t4">
            {hours.toString().replace(".", ",")} h ·{" "}
            <span className="font-mono text-t2">{formatEuro(total)}</span> a
            persona
            {positions > 1 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-mono text-t2">
                  {formatEuro(total * positions)}
                </span>{" "}
                in tutto
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-t3">
          Requisiti
        </span>
        <div className="flex flex-wrap gap-1.5">
          {EXTRA_SHIFT_BADGES.map((b) => {
            const on = badges.has(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggleBadge(b)}
                className={cn(
                  "focus-gold rounded-full border px-3 py-1 text-xs font-medium transition",
                  on
                    ? "border-border-gold bg-gold/15 text-gold"
                    : "border-border-2 bg-bg-1 text-t2 hover:bg-bg-2"
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Note" hint="Visibili a chi vede l'annuncio.">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      {error ? <p className="text-xs text-error">{error}</p> : null}
      {mutationError ? (
        <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
          {mutationError.message}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <Button variant="gold" onClick={onSubmit} disabled={pending}>
          {pending
            ? "Salvataggio…"
            : shift
              ? "Salva modifiche"
              : "Pubblica il turno"}
        </Button>
      </div>
    </div>
  );
}
