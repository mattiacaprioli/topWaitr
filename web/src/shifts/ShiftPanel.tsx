import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateInternalShifts,
  useShiftAssignments,
  useShiftRoleRequirements,
  useUpdateInternalShift,
} from "@/features/assignments/hooks";
import { useUpdateShiftStatus } from "@/features/shifts/hooks";
import { useVenueStaff } from "@/features/staff/hooks";
import { STAFF_ROLES } from "@/features/staff/roles";
import { computeCoverage } from "@/features/assignments/coverage";
import {
  ASSIGNMENT_STATUS_LABEL,
  isActiveAssignment,
  type AssignmentStatus,
} from "@/features/assignments/status";
import { formatTime, toDateString } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Shift } from "@/features/shifts/api";
import { useVenue } from "../lib/venue";
import { dayLabel, startOfWeek, weekDays } from "../lib/week";
import { Button, Field, Input, Pill, Textarea } from "../ui/primitives";
import { PresenceSection } from "./PresenceSection";
import { MarketplaceForm } from "./MarketplaceForm";
import { internalShiftSchema, type InternalShiftForm } from "./schema";

type RoleTarget = { role: string; count: number };

/** Data di oggi nel formato delle colonne `date` (confronto lessicografico ok). */
function todayDbDate(): string {
  return toDateString(new Date());
}

/**
 * Pannello laterale di creazione/modifica turno, per entrambe le modalità:
 * turni **interni** (il gestore chiama il proprio staff — il caso d'uso da
 * scrivania) e turni **marketplace**, che da qui si pubblicano e si modificano.
 * Le candidature restano su una pagina dedicata, che è dove si decide.
 */
export function ShiftPanel({
  date,
  shift,
  initialStaffIds,
  onClose,
}: {
  date: string;
  shift?: Shift;
  /**
   * Persone già selezionate in creazione. Serve alla vista per persona: si
   * clicca la casella vuota di chi è libero e il turno nasce già suo.
   */
  initialStaffIds?: string[];
  onClose: () => void;
}) {
  // In creazione il tipo si sceglie; in modifica lo detta il turno (`kind` non
  // è cambiabile: un turno interno e uno marketplace hanno tabelle collegate
  // diverse — assegnazioni contro candidature).
  const [kind, setKind] = useState<"internal" | "marketplace">(
    shift?.kind ?? "internal"
  );
  const effectiveKind = shift?.kind ?? kind;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border-2 bg-bg-0 p-6">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl text-t1">
              {shift ? "Modifica turno" : "Nuovo turno"}
            </h2>
            <p className="mt-1 text-xs text-t3">
              {effectiveKind === "internal"
                ? "Con il tuo staff interno"
                : "Pubblicato sul marketplace"}
            </p>
          </div>
          <Button onClick={onClose} aria-label="Chiudi">
            Chiudi
          </Button>
        </header>

        {!shift ? (
          <div className="mb-5 grid grid-cols-2 gap-2">
            <KindOption
              active={kind === "internal"}
              onClick={() => setKind("internal")}
              title="Chiamo il mio staff"
              detail="Assegni le persone del tuo organico."
            />
            <KindOption
              active={kind === "marketplace"}
              onClick={() => setKind("marketplace")}
              title="Cerco un extra"
              detail="Pubblichi un annuncio, ricevi candidature."
            />
          </div>
        ) : null}

        {effectiveKind === "marketplace" ? (
          <MarketplaceSection date={date} shift={shift} onClose={onClose} />
        ) : (
          <InternalForm
            date={date}
            shift={shift}
            initialStaffIds={initialStaffIds}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function KindOption({
  active,
  onClick,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-gold rounded-2xl border p-3 text-left transition",
        active
          ? "border-border-gold bg-gold/10"
          : "border-border-2 bg-bg-card hover:bg-bg-1"
      )}
    >
      <span
        className={cn(
          "block text-sm font-semibold",
          active ? "text-gold" : "text-t1"
        )}
      >
        {title}
      </span>
      <span className="mt-0.5 block text-xs leading-4 text-t4">{detail}</span>
    </button>
  );
}

function MarketplaceSection({
  date,
  shift,
  onClose,
}: {
  date: string;
  shift?: Shift;
  onClose: () => void;
}) {
  const venue = useVenue();
  const navigate = useNavigate();
  const status = useUpdateShiftStatus(shift?.id ?? "", venue.id);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {shift ? (
        <div className="flex flex-wrap items-center gap-2">
          <Pill
            tone={
              shift.status === "open"
                ? "success"
                : shift.status === "cancelled"
                  ? "error"
                  : "neutral"
            }
          >
            {shift.status === "open"
              ? "Aperto"
              : shift.status === "closed"
                ? "Chiuso"
                : "Annullato"}
          </Pill>
          <Pill tone="neutral">
            {shift.positions_filled}/{shift.positions_total} coperti
          </Pill>
          <button
            onClick={() => navigate("/candidature")}
            className="focus-gold text-xs text-gold underline underline-offset-2"
          >
            Vedi le candidature
          </button>
        </div>
      ) : null}

      <MarketplaceForm date={date} shift={shift} onClose={onClose} />

      {shift ? (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {shift.status !== "open" ? (
            <Button
              onClick={() => status.mutate("open", { onSuccess: onClose })}
              disabled={status.isPending}
            >
              Riapri
            </Button>
          ) : (
            <Button
              onClick={() => status.mutate("closed", { onSuccess: onClose })}
              disabled={status.isPending}
            >
              Chiudi le candidature
            </Button>
          )}
          {shift.status !== "cancelled" ? (
            <Button
              variant="danger"
              onClick={() => status.mutate("cancelled", { onSuccess: onClose })}
              disabled={status.isPending}
            >
              Annulla turno
            </Button>
          ) : null}
          {status.isError ? (
            <p className="w-full text-xs text-error">{status.error.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function InternalForm({
  date,
  shift,
  initialStaffIds,
  onClose,
}: {
  date: string;
  shift?: Shift;
  initialStaffIds?: string[];
  onClose: () => void;
}) {
  const venue = useVenue();
  const staffQuery = useVenueStaff(venue.id);
  const assignmentsQuery = useShiftAssignments(shift?.id ?? "");
  const roleReqsQuery = useShiftRoleRequirements(shift?.id ?? "");
  const create = useCreateInternalShifts(venue.id);
  const update = useUpdateInternalShift(shift?.id ?? "");
  const status = useUpdateShiftStatus(shift?.id ?? "", venue.id);

  const [staffIds, setStaffIds] = useState<string[]>(initialStaffIds ?? []);
  const [roleTargets, setRoleTargets] = useState<RoleTarget[]>([]);
  // Giorni **in più** su cui ripetere lo stesso turno, in creazione.
  const [extraDates, setExtraDates] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InternalShiftForm>({
    resolver: zodResolver(internalShiftSchema),
    defaultValues: {
      title: shift?.title ?? "",
      date: shift?.date ?? date,
      start_time: shift?.start_time?.slice(0, 5) ?? "18:00",
      end_time: shift?.end_time?.slice(0, 5) ?? "23:00",
      description: shift?.description ?? "",
    },
  });

  // Su un turno esistente, assegnati e fabbisogni arrivano da due query: si
  // sincronizzano nello stato locale appena disponibili.
  // ⚠️ Solo su un turno esistente: in creazione la query gira con id vuoto e
  // sovrascriverebbe `initialStaffIds` con una lista vuota.
  useEffect(() => {
    if (shift && assignmentsQuery.data) {
      setStaffIds(
        assignmentsQuery.data
          .map((a) => a.staff_member_id)
          .filter((id): id is string => !!id)
      );
    }
  }, [shift, assignmentsQuery.data]);

  useEffect(() => {
    if (roleReqsQuery.data) {
      setRoleTargets(
        roleReqsQuery.data.map((r) => ({ role: r.role, count: r.count }))
      );
    }
  }, [roleReqsQuery.data]);

  const staff = staffQuery.data ?? [];
  const selectedStaff = useMemo(
    () => staff.filter((m) => staffIds.includes(m.id)),
    [staff, staffIds]
  );

  // Stato reale dell'assegnazione. Chi ha rifiutato (o è stato segnato assente)
  // resta in elenco ma NON copre il suo ruolo: darlo per `assigned` faceva
  // sembrare coperto un turno in cui quella persona non viene.
  const statusById = useMemo(
    () =>
      new Map<string, AssignmentStatus>(
        (assignmentsQuery.data ?? []).map((a) => [a.staff_member_id, a.status])
      ),
    [assignmentsQuery.data]
  );

  /** Chi viene selezionato ora non ha ancora una riga: sarà `assigned` al salvataggio. */
  function staffStatus(id: string): AssignmentStatus {
    return statusById.get(id) ?? "assigned";
  }

  const coverage = useMemo(
    () =>
      computeCoverage(
        roleTargets,
        selectedStaff.map((m) => ({
          status: statusById.get(m.id) ?? "assigned",
          role: m.role,
        }))
      ),
    [roleTargets, selectedStaff, statusById]
  );

  const workingCount = selectedStaff.filter((m) =>
    isActiveAssignment(staffStatus(m.id))
  ).length;

  function toggleStaff(id: string) {
    setStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function setRoleCount(role: string, count: number) {
    setRoleTargets((prev) => {
      const rest = prev.filter((t) => t.role !== role);
      return count > 0 ? [...rest, { role, count }] : rest;
    });
  }

  // I sette giorni della settimana della data scelta: è lì che si ripete un
  // turno di servizio ("anche giovedì e sabato"), non a distanza di mesi.
  const formDate = watch("date");
  const weekOfForm = useMemo(
    () => (formDate ? weekDays(startOfWeek(new Date(`${formDate}T00:00:00`))) : []),
    [formDate]
  );

  // Se si cambia data e si finisce in un'altra settimana, i giorni spuntati
  // prima non esistono più in griglia: si azzerano invece di restare invisibili
  // e creare turni a sorpresa.
  const weekKey = weekOfForm[0] ?? "";
  useEffect(() => {
    setExtraDates((prev) => prev.filter((d) => weekOfForm.includes(d)));
    // Dipende solo dal cambio di settimana: `weekOfForm` è derivato da lì.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey]);

  function toggleExtraDate(day: string) {
    setExtraDates((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const pending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  function onSubmit(values: InternalShiftForm) {
    const payload = {
      title: values.title,
      date: values.date,
      start_time: values.start_time,
      end_time: values.end_time,
      description: values.description.trim() || null,
      staffIds,
      roleTargets,
    };
    if (shift) {
      update.mutate(payload, { onSuccess: onClose });
      return;
    }
    // Un turno o dieci passano dalla stessa mutation: la data è l'unica cosa
    // che cambia tra le copie.
    const dates = [values.date, ...extraDates.filter((d) => d !== values.date)];
    create.mutate(
      dates.sort().map((d) => ({ ...payload, date: d })),
      { onSuccess: onClose }
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col gap-4"
    >
      <Field label="Titolo" error={errors.title?.message}>
        <Input {...register("title")} placeholder="Servizio serale" />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Data" error={errors.date?.message}>
          <Input type="date" {...register("date")} />
        </Field>
        <Field label="Inizio" error={errors.start_time?.message}>
          <Input type="time" {...register("start_time")} />
        </Field>
        <Field label="Fine" error={errors.end_time?.message}>
          <Input type="time" {...register("end_time")} />
        </Field>
      </div>

      {/* Solo in creazione: su un turno esistente "ripeti" vorrebbe dire
          crearne altri, cosa diversa dal modificare questo. */}
      {!shift ? (
        <section>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-t3">
            Ripeti anche il…
          </span>
          <div className="grid grid-cols-7 gap-1">
            {weekOfForm.map((day) => {
              const isMain = day === formDate;
              const on = isMain || extraDates.includes(day);
              const { name, num } = dayLabel(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isMain}
                  onClick={() => toggleExtraDate(day)}
                  title={isMain ? "È la data del turno" : undefined}
                  className={cn(
                    "focus-gold rounded-xl border py-1.5 text-center transition",
                    on
                      ? "border-border-gold bg-gold/10 text-gold"
                      : "border-border-2 bg-bg-1 text-t3 hover:bg-bg-2",
                    isMain && "cursor-default"
                  )}
                >
                  <span className="block text-[10px] uppercase">{name}</span>
                  <span className="block font-mono text-xs">{num}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-t4">
            {extraDates.length === 0
              ? "Stessi orari, staff e fabbisogno su più giorni della settimana."
              : `Verranno creati ${extraDates.length + 1} turni identici, uno per giorno.`}
          </p>
        </section>
      ) : null}

      <Field label="Note" hint="Visibili a chi è assegnato al turno.">
        <Textarea {...register("description")} />
      </Field>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-t3">
            Fabbisogno per ruolo
          </span>
          {coverage.required > 0 ? (
            <Pill tone={coverage.missing > 0 ? "warning" : "success"}>
              {coverage.covered}/{coverage.required} coperti
            </Pill>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STAFF_ROLES.map((role) => {
            const count = roleTargets.find((t) => t.role === role)?.count ?? 0;
            return (
              <div
                key={role}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5",
                  count > 0
                    ? "border-border-gold bg-gold/5"
                    : "border-border-2 bg-bg-1"
                )}
              >
                <span className="truncate text-xs text-t2">{role}</span>
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={count}
                  onChange={(e) =>
                    setRoleCount(role, Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-14 px-2 py-1 text-center font-mono text-xs"
                />
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-t3">
          Chi lavora ({workingCount})
        </span>
        {staff.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-2 px-3 py-4 text-center text-xs text-t4">
            Nessuno nel tuo organico. Aggiungi il personale dalla sezione Staff.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {staff.map((member) => {
              const on = staffIds.includes(member.id);
              const status = staffStatus(member.id);
              const works = isActiveAssignment(status);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleStaff(member.id)}
                  className={cn(
                    "focus-gold flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition",
                    on && works && "border-border-gold bg-gold/10",
                    on && !works && "border-error/40 bg-error/5",
                    !on && "border-border-2 bg-bg-1 hover:bg-bg-2"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-t1">
                      {member.display_name}
                    </span>
                    <span className="block truncate text-xs text-t4">
                      {member.role ?? "Ruolo non indicato"}
                    </span>
                  </span>
                  {on ? (
                    <Pill tone={works ? "gold" : "error"}>
                      {ASSIGNMENT_STATUS_LABEL[status]}
                    </Pill>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Solo a turno concluso: prima non c'è nulla da consuntivare. */}
      {shift && shift.date <= todayDbDate() && shift.status !== "cancelled" ? (
        <PresenceSection
          shiftId={shift.id}
          startTime={shift.start_time}
          endTime={shift.end_time}
        />
      ) : null}

      {mutationError ? (
        <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
          {mutationError.message}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button type="submit" variant="gold" disabled={pending}>
          {pending
            ? "Salvataggio…"
            : shift
              ? "Salva modifiche"
              : extraDates.length > 0
                ? `Crea ${extraDates.length + 1} turni`
                : "Crea turno"}
        </Button>
        {shift && shift.status !== "cancelled" ? (
          <Button
            type="button"
            variant="danger"
            onClick={() => status.mutate("cancelled", { onSuccess: onClose })}
            disabled={status.isPending}
          >
            Annulla turno
          </Button>
        ) : null}
      </div>
      {shift ? (
        <p className="text-[11px] leading-4 text-t4">
          Chi viene aggiunto riceve una notifica; a chi viene tolto il turno
          sparisce. Se cambi giorno o orario, gli assegnati vengono avvisati.
        </p>
      ) : null}
    </form>
  );
}
