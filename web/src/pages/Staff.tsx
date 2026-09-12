import { useState } from "react";
import { Link } from "react-router-dom";
import { useVenueStaff } from "@/features/staff/hooks";
import {
  staffRoleNames,
  type StaffMemberWithWaiter,
} from "@/features/staff/api";
import { useVenue } from "../lib/venue";
import { AddStaffPanel } from "../staff/AddStaffPanel";
import { StaffDetail } from "../staff/StaffDetail";
import {
  Button,
  Card,
  PageHeader,
  Pill,
  Placeholder,
  QueryError,
  Spinner,
} from "../ui/primitives";

export function StaffPage() {
  const venue = useVenue();
  const { data, isPending, isError, error } = useVenueStaff(venue.id);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<StaffMemberWithWaiter | null>(null);

  if (isPending) return <Spinner />;
  if (isError) return <QueryError error={error} />;

  const staff = data ?? [];
  const pending = staff.filter((s) => s.link_status === "pending").length;

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle={
          pending > 0
            ? `${staff.length} nel tuo organico · ${pending} in attesa di risposta`
            : `${staff.length} nel tuo organico`
        }
        actions={
          <div className="flex gap-2">
            <Link to="/ruoli">
              <Button>Ruoli del locale</Button>
            </Link>
            <Button variant="gold" onClick={() => setAdding((v) => !v)}>
              {adding ? "Annulla" : "+ Aggiungi"}
            </Button>
          </div>
        }
      />

      {adding ? <AddStaffPanel onClose={() => setAdding(false)} /> : null}

      {staff.length === 0 && !adding ? (
        <Placeholder
          title="Nessuno nel tuo organico"
          detail="Aggiungi le persone che lavorano nel locale: potrai assegnarle ai turni e tenere il conto delle ore."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {staff.map((member) => (
            <Card
              key={member.id}
              className="flex cursor-pointer flex-wrap items-center gap-4 p-4 transition hover:border-border-gold"
              // La riga intera apre la scheda: da scrivania è il gesto atteso.
            >
              <button
                onClick={() => setSelected(member)}
                className="focus-gold flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <span className="min-w-40 flex-1">
                  <span className="block truncate text-sm font-semibold text-t1">
                    {member.display_name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-t4">
                    {staffRoleNames(member) ?? "Ruoli non indicati"}
                    {member.phone ? ` · ${member.phone}` : ""}
                  </span>
                </span>

                <Pill tone="neutral">
                  {member.employment_type === "fisso" ? "Fisso" : "A chiamata"}
                </Pill>

                {member.link_status === "pending" ? (
                  <Pill tone="warning">Invito in attesa</Pill>
                ) : member.waiter ? (
                  <Pill tone="success">Collegato</Pill>
                ) : (
                  <Pill tone="neutral">Scheda</Pill>
                )}
              </button>
            </Card>
          ))}
        </div>
      )}

      {selected ? (
        <StaffDetail
          // Rimonta la scheda quando cambi persona: gli stati locali dei campi
          // devono ripartire dai valori di quella nuova.
          key={selected.id}
          member={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
