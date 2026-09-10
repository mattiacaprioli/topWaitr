import { useState } from "react";
import {
  useRemoveStaffMember,
  useUpdateStaffMember,
} from "@/features/staff/hooks";
import { useStaffAssignments } from "@/features/assignments/hooks";
import { assignmentHours, isWorked } from "@/features/assignments/hours";
import { useWaiterPublicCard } from "@/features/reviews/hooks";
import { STAFF_ROLES } from "@/features/staff/roles";
import { formatDate, formatHours, formatTime, toDateString } from "@/lib/format";
import type { StaffMemberWithWaiter } from "@/features/staff/api";
import type { Enums } from "@/types/database";
import { cn } from "@/lib/cn";
import {
  Button,
  Card,
  Field,
  Input,
  Pill,
  Select,
  Spinner,
  Textarea,
} from "../ui/primitives";
import { useToast } from "../ui/Toast";

/**
 * Scheda di un membro dell'organico: anagrafica modificabile, ore e performance.
 * Le metriche sono calcolate con le stesse funzioni pure dell'app
 * (`isWorked`/`assignmentHours`), così i numeri coincidono sui due schermi.
 */
export function StaffDetail({
  member,
  onClose,
}: {
  member: StaffMemberWithWaiter;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full max-w-lg flex-col gap-6 overflow-y-auto border-l border-border-2 bg-bg-0 p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-xl text-t1">
              {member.display_name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {member.link_status === "pending" ? (
                <Pill tone="warning">Invito in attesa</Pill>
              ) : member.waiter ? (
                <Pill tone="success">Account collegato</Pill>
              ) : (
                <Pill tone="neutral">Scheda senza account</Pill>
              )}
              <Pill tone="neutral">
                {member.employment_type === "fisso" ? "Fisso" : "A chiamata"}
              </Pill>
            </div>
          </div>
          <Button onClick={onClose}>Chiudi</Button>
        </header>

        <Anagrafica member={member} />
        <Performance
          staffMemberId={member.id}
          waiterId={member.waiter_id ?? null}
        />
        <RemoveSection memberId={member.id} onRemoved={onClose} />
      </div>
    </div>
  );
}

function Anagrafica({ member }: { member: StaffMemberWithWaiter }) {
  const update = useUpdateStaffMember();
  const toast = useToast();
  const [name, setName] = useState(member.display_name);
  const [role, setRole] = useState(member.role ?? STAFF_ROLES[0]);
  const [empType, setEmpType] = useState<Enums<"employment_type">>(
    member.employment_type
  );
  const [phone, setPhone] = useState(member.phone ?? "");
  const [notes, setNotes] = useState(member.note ?? "");

  return (
    <section className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-t3">
        Scheda
      </span>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Telefono">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Ruolo">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Impiego">
          <Select
            value={empType}
            onChange={(e) =>
              setEmpType(e.target.value as Enums<"employment_type">)
            }
          >
            <option value="fisso">Fisso</option>
            <option value="a_chiamata">A chiamata</option>
          </Select>
        </Field>
      </div>

      <Field label="Note" hint="Private, visibili solo a te.">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div>
        <Button
          variant="gold"
          disabled={update.isPending || !name.trim()}
          onClick={() =>
            update.mutate(
              {
                id: member.id,
                fields: {
                  display_name: name.trim(),
                  role,
                  employment_type: empType,
                  phone: phone.trim() || null,
                  note: notes.trim() || null,
                },
              },
              {
                onSuccess: () => toast.show("Scheda aggiornata"),
                onError: (e) => toast.show(e.message, "error"),
              }
            )
          }
        >
          {update.isPending ? "Salvataggio…" : "Salva"}
        </Button>
      </div>
    </section>
  );
}

function Performance({
  staffMemberId,
  waiterId,
}: {
  staffMemberId: string;
  waiterId: string | null;
}) {
  const query = useStaffAssignments(staffMemberId);
  const card = useWaiterPublicCard(waiterId ?? undefined).data ?? null;

  if (query.isLoading) return <Spinner />;

  const assignments = query.data ?? [];
  const today = toDateString(new Date());
  const past = assignments.filter((a) => a.shift != null && a.shift.date < today);
  const worked = past.filter((a) => isWorked(a.status));
  const noShow = past.filter((a) => a.status === "no_show").length;
  const declined = past.filter((a) => a.status === "declined").length;
  const totalPast = past.length;
  const reliability = totalPast > 0 ? worked.length / totalPast : null;
  const totalHours = worked.reduce(
    (sum, a) => sum + assignmentHours(a.status, a.worked_hours, a.shift),
    0
  );
  const recent = worked.slice(0, 6);

  return (
    <section className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-t3">
        Performance
      </span>

      {waiterId ? (
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm text-t2">Valutazione clienti</span>
          {card && card.rating_count ? (
            <span className="font-mono text-sm text-gold">
              ★ {card.rating_avg?.toFixed(1)}{" "}
              <span className="text-t4">({card.rating_count})</span>
            </span>
          ) : (
            <span className="text-xs text-t4">Nessuna recensione</span>
          )}
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="font-mono text-2xl text-t1">{worked.length}</p>
          <p className="mt-1 text-xs text-t3">turni svolti</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-2xl text-t1">
            {formatHours(totalHours)}
          </p>
          <p className="mt-1 text-xs text-t3">ore totali</p>
        </Card>
      </div>

      {reliability != null ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-t2">Affidabilità</span>
            <span className="text-sm font-semibold text-gold">
              {Math.round(reliability * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-bg-2">
            <div
              className={cn(
                "h-1.5 rounded-full",
                reliability >= 0.9 ? "bg-success" : "bg-warning"
              )}
              style={{ width: `${reliability * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-t3">
            {noShow + declined > 0
              ? `${noShow} assenze · ${declined} rifiuti su ${totalPast} turni`
              : `Sempre presente su ${totalPast} ${totalPast === 1 ? "turno" : "turni"}`}
          </p>
        </Card>
      ) : null}

      {recent.length > 0 ? (
        <div>
          <span className="mb-2 block text-xs text-t4">Ultimi turni</span>
          <Card className="p-0">
            {recent.map((a, i) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm",
                  i > 0 && "border-t border-border"
                )}
              >
                <span className="text-t2">
                  {a.shift ? formatDate(a.shift.date) : "—"}
                  {a.shift ? (
                    <span className="ml-2 font-mono text-xs text-t4">
                      {formatTime(a.shift.start_time)}–
                      {formatTime(a.shift.end_time)}
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-xs text-t1">
                  {formatHours(
                    assignmentHours(a.status, a.worked_hours, a.shift)
                  )}
                </span>
              </div>
            ))}
          </Card>
        </div>
      ) : null}
    </section>
  );
}

function RemoveSection({
  memberId,
  onRemoved,
}: {
  memberId: string;
  onRemoved: () => void;
}) {
  const remove = useRemoveStaffMember();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="mt-auto border-t border-border pt-4">
      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-5 text-warning">
            Rimuovendo questa persona perdi anche lo storico delle sue ore, e le
            sue assegnazioni future vengono cancellate.
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(memberId, {
                  onSuccess: onRemoved,
                  onError: (e) => toast.show(e.message, "error"),
                })
              }
            >
              {remove.isPending ? "Rimozione…" : "Conferma rimozione"}
            </Button>
            <Button onClick={() => setConfirming(false)}>Annulla</Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Rimuovi dall'organico
        </Button>
      )}
    </section>
  );
}
