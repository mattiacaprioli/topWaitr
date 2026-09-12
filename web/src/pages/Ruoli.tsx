import { useState } from "react";
import {
  useArchiveVenueRole,
  useCreateVenueRole,
  useRenameVenueRole,
  useVenueRoles,
} from "@/features/roles/hooks";
import type { VenueRole } from "@/features/roles/api";
import { SUGGESTED_ROLES } from "@/features/staff/roles";
import { useVenue } from "../lib/venue";
import { useToast } from "../ui/Toast";
import {
  Button,
  Card,
  Input,
  PageHeader,
  Placeholder,
  QueryError,
  Spinner,
} from "../ui/primitives";

/** Una riga: nome modificabile in linea + elimina (archivia). */
function RoleRow({ role }: { role: VenueRole }) {
  const toast = useToast();
  const rename = useRenameVenueRole();
  const archive = useArchiveVenueRole();
  const [name, setName] = useState(role.name);
  const [confirming, setConfirming] = useState(false);

  function save() {
    const next = name.trim();
    if (!next || next === role.name) {
      setName(role.name);
      return;
    }
    rename.mutate(
      { id: role.id, name: next },
      {
        onError: () => {
          setName(role.name);
          toast.show("Nome già usato o non valido.", "error");
        },
      }
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setName(role.name);
        }}
        className="max-w-xs"
      />
      {confirming ? (
        <span className="flex items-center gap-2">
          <span className="text-xs text-t4">
            I turni passati continueranno a mostrarlo.
          </span>
          <Button
            variant="danger"
            disabled={archive.isPending}
            onClick={() =>
              archive.mutate(role.id, {
                onSuccess: () => toast.show("Ruolo eliminato"),
                onError: (e) => toast.show(e.message, "error"),
              })
            }
          >
            Elimina
          </Button>
          <Button onClick={() => setConfirming(false)}>Annulla</Button>
        </span>
      ) : (
        <Button onClick={() => setConfirming(true)}>Elimina</Button>
      )}
    </Card>
  );
}

/**
 * I ruoli del locale. Era una lista fissa uguale per tutti: un hotel non ha un
 * sommelier e una discoteca ha il PR, quindi ora la scrive chi gestisce.
 */
export function RuoliPage() {
  const venue = useVenue();
  const toast = useToast();
  const { data, isPending, isError, error } = useVenueRoles(venue.id);
  const create = useCreateVenueRole();
  const [draft, setDraft] = useState("");

  if (isPending) return <Spinner />;
  if (isError) return <QueryError error={error} />;

  const roles = data ?? [];

  function add(name: string) {
    if (!name.trim()) return;
    create.mutate(
      { venueId: venue.id, name },
      {
        onSuccess: () => setDraft(""),
        onError: () => toast.show("Ruolo già presente o non valido.", "error"),
      }
    );
  }

  // I suggerimenti spariscono man mano che la lista si riempie: servono a chi
  // parte da zero, non a chi ha già deciso come chiamare le proprie mansioni.
  const taken = new Set(roles.map((r) => r.name.trim().toLowerCase()));
  const suggestions = SUGGESTED_ROLES.filter((s) => !taken.has(s.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Ruoli del locale"
        subtitle="Le mansioni che assegni allo staff e che chiedi sui turni."
      />

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add(draft);
          }}
          placeholder="Es. Pizzaiolo"
          className="max-w-xs"
        />
        <Button
          variant="gold"
          disabled={create.isPending || !draft.trim()}
          onClick={() => add(draft)}
        >
          Aggiungi
        </Button>
        {suggestions.length > 0 ? (
          <span className="ml-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-t4">Esempi:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="focus-gold rounded-full border border-border-2 px-2.5 py-0.5 text-xs text-t3 transition hover:bg-bg-2"
              >
                + {s}
              </button>
            ))}
          </span>
        ) : null}
      </Card>

      {roles.length === 0 ? (
        <Placeholder
          title="Nessun ruolo"
          detail="Aggiungi le mansioni del tuo locale: potrai assegnarle allo staff e chiederle sui turni."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {roles.map((r) => (
            <RoleRow key={r.id} role={r} />
          ))}
        </div>
      )}
    </>
  );
}
