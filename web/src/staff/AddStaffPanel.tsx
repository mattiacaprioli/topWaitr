import { useMemo, useState } from "react";
import {
  useAddStaffMember,
  useFindWaiterByEmail,
  useVenueStaff,
  useWorkedWithWaiters,
} from "@/features/staff/hooks";
import { canonicalRole, STAFF_ROLES } from "@/features/staff/roles";
import type { WaiterLookup } from "@/features/staff/api";
import type { Enums } from "@/types/database";
import { cn } from "@/lib/cn";
import { useVenue } from "../lib/venue";
import {
  Button,
  Card,
  Field,
  Input,
  Pill,
  Select,
  Spinner,
} from "../ui/primitives";
import { useToast } from "../ui/Toast";

type Mode = "storico" | "manuale" | "invita";

/**
 * I tre modi di aggiungere una persona all'organico, come nell'app:
 * chi ha già lavorato qui, una scheda manuale (senza account), o un invito via
 * email a chi è già su topWaitr.
 */
export function AddStaffPanel({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("storico");

  return (
    <Card className="mb-5">
      <div className="mb-4 flex gap-2">
        <ModeTab
          active={mode === "storico"}
          onClick={() => setMode("storico")}
          label="Ha già lavorato qui"
        />
        <ModeTab
          active={mode === "manuale"}
          onClick={() => setMode("manuale")}
          label="Scheda manuale"
        />
        <ModeTab
          active={mode === "invita"}
          onClick={() => setMode("invita")}
          label="Invita via email"
        />
      </div>

      {mode === "storico" ? <WorkedWithList onDone={onClose} /> : null}
      {mode === "manuale" ? <ManualForm onDone={onClose} /> : null}
      {mode === "invita" ? <InviteForm onDone={onClose} /> : null}
    </Card>
  );
}

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "focus-gold rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-gold text-gold-ink"
          : "border border-border-2 bg-bg-1 text-t2 hover:bg-bg-2"
      )}
    >
      {label}
    </button>
  );
}

function WorkedWithList({ onDone }: { onDone: () => void }) {
  const venue = useVenue();
  const { data, isPending } = useWorkedWithWaiters(venue.id);
  const staff = useVenueStaff(venue.id).data ?? [];
  const add = useAddStaffMember();
  const toast = useToast();

  // Chi è già in organico non va riproposto: `waiter_id` è la chiave del legame.
  const alreadyIn = useMemo(
    () => new Set(staff.map((s) => s.waiter_id).filter(Boolean)),
    [staff]
  );

  if (isPending) return <Spinner />;

  const candidates = (data ?? []).filter((w) => !alreadyIn.has(w.id));

  if (candidates.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-t3">
        Nessun professionista da aggiungere: chi ha lavorato qui è già nel tuo
        organico, oppure non hai ancora accettato candidature.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {candidates.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border-2 bg-bg-1 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm text-t1">
              {w.full_name ?? "Professionista"}
            </p>
            <p className="truncate text-xs text-t4">
              {w.primary_role ?? "Ruolo non indicato"}
            </p>
          </div>
          <Button
            disabled={add.isPending}
            onClick={() =>
              add.mutate(
                {
                  venue_id: venue.id,
                  display_name: w.full_name ?? "Professionista",
                  // Il ruolo arriva dal profilo di un'altra persona: va
                  // riportato alla forma canonica o non combacerà mai con un
                  // fabbisogno.
                  role: canonicalRole(w.primary_role),
                  waiter_id: w.id,
                  employment_type: "a_chiamata",
                },
                {
                  onSuccess: () => {
                    toast.show("Aggiunto allo staff");
                    onDone();
                  },
                  onError: (e) => toast.show(e.message, "error"),
                }
              )
            }
          >
            Aggiungi
          </Button>
        </div>
      ))}
    </div>
  );
}

function ManualForm({ onDone }: { onDone: () => void }) {
  const venue = useVenue();
  const add = useAddStaffMember();
  const toast = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(STAFF_ROLES[0]);
  const [empType, setEmpType] = useState<Enums<"employment_type">>("a_chiamata");
  const [phone, setPhone] = useState("");

  return (
    <>
      <div className="grid grid-cols-4 items-end gap-3">
        <Field label="Nome">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome e cognome"
          />
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
        <Field label="Telefono">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="gold"
          disabled={!name.trim() || add.isPending}
          onClick={() =>
            add.mutate(
              {
                venue_id: venue.id,
                display_name: name.trim(),
                role,
                employment_type: empType,
                phone: phone.trim() || null,
              },
              {
                onSuccess: () => {
                  toast.show("Aggiunto allo staff");
                  onDone();
                },
                onError: (e) => toast.show(e.message, "error"),
              }
            )
          }
        >
          {add.isPending ? "Salvataggio…" : "Aggiungi"}
        </Button>
        <span className="text-xs text-t4">
          Scheda senza account: puoi assegnarla ai turni e contarne le ore, ma la
          persona non riceve notifiche.
        </span>
      </div>
    </>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const venue = useVenue();
  const find = useFindWaiterByEmail();
  const add = useAddStaffMember();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<WaiterLookup | null>(null);
  const [searched, setSearched] = useState(false);
  const [inviteType, setInviteType] =
    useState<Enums<"employment_type">>("fisso");

  const staff = useVenueStaff(venue.id).data ?? [];
  const existing = found
    ? staff.find((s) => s.waiter_id === found.id)
    : undefined;

  function onSearch() {
    const e = email.trim();
    if (!e) return;
    find.mutate(e, {
      onSuccess: (res) => {
        setFound(res);
        setSearched(true);
      },
      onError: () => toast.show("Ricerca non riuscita. Riprova.", "error"),
    });
  }

  return (
    <>
      <div className="flex items-end gap-3">
        <Field
          label="Email del professionista"
          hint="Deve corrispondere esattamente a quella del suo account."
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSearched(false);
              setFound(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder="nome@esempio.it"
            className="w-72"
          />
        </Field>
        <Button onClick={onSearch} disabled={!email.trim() || find.isPending}>
          {find.isPending ? "Cerco…" : "Cerca"}
        </Button>
      </div>

      {searched && !found ? (
        <p className="mt-4 text-sm text-t3">
          Nessun account con questa email. Puoi comunque creare una{" "}
          <b className="text-t1">scheda manuale</b>.
        </p>
      ) : null}

      {found ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-2 bg-bg-1 p-3">
          <div className="min-w-40 flex-1">
            <p className="text-sm font-semibold text-t1">
              {found.full_name ?? "Professionista"}
            </p>
            <p className="mt-0.5 text-xs text-t4">
              {found.city ?? "Città non indicata"}
            </p>
          </div>

          {existing ? (
            <Pill
              tone={existing.link_status === "pending" ? "warning" : "success"}
            >
              {existing.link_status === "pending"
                ? "In attesa di risposta"
                : "Già nel tuo staff"}
            </Pill>
          ) : (
            <>
              <Select
                value={inviteType}
                onChange={(e) =>
                  setInviteType(e.target.value as Enums<"employment_type">)
                }
                className="w-36"
                aria-label="Tipo di impiego"
              >
                <option value="fisso">Fisso</option>
                <option value="a_chiamata">A chiamata</option>
              </Select>
              <Button
                variant="gold"
                disabled={add.isPending}
                onClick={() =>
                  add.mutate(
                    {
                      venue_id: venue.id,
                      display_name: found.full_name ?? email.trim(),
                      employment_type: inviteType,
                      waiter_id: found.id,
                      link_status: "pending",
                    },
                    {
                      onSuccess: () => {
                        toast.show("Richiesta inviata");
                        onDone();
                      },
                      onError: (e) => toast.show(e.message, "error"),
                    }
                  )
                }
              >
                Invia richiesta
              </Button>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
