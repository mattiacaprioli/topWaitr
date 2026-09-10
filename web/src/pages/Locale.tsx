import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { useSaveVenue } from "@/features/venues/hooks";
import { venueSchema, type VenueForm } from "@/features/venues/schema";
import { useVenueOptional } from "../lib/venue";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "../ui/primitives";

/**
 * Scheda del locale. Unica pagina raggiungibile senza un locale esistente: è da
 * qui che si crea. Riusa `venueSchema` dell'app, così le regole di validazione
 * restano una sola.
 */
export function LocalePage() {
  const { session } = useAuth();
  const venue = useVenueOptional();
  const save = useSaveVenue(session!.user.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<VenueForm>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: venue?.name ?? "",
      city: venue?.city ?? "",
      address: venue?.address ?? "",
      cuisine_type: venue?.cuisine_type ?? "",
      description: venue?.description ?? "",
    },
  });

  return (
    <>
      <PageHeader
        title={venue ? "Locale" : "Crea il tuo locale"}
        subtitle={
          venue
            ? "Questi dati sono ciò che i professionisti vedono di te."
            : "Serve per pubblicare turni e gestire il personale."
        }
      />

      <Card className="max-w-2xl">
        <form
          onSubmit={handleSubmit((values) =>
            save.mutate({ input: values, venueId: venue?.id })
          )}
          className="flex flex-col gap-4"
        >
          <Field label="Nome del locale" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Trattoria da Mario" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Città" error={errors.city?.message}>
              <Input {...register("city")} />
            </Field>
            <Field label="Indirizzo" error={errors.address?.message}>
              <Input {...register("address")} />
            </Field>
          </div>

          <Field
            label="Tipo di locale"
            hint="Ristorante, hotel, catering, pub, discoteca…"
            error={errors.cuisine_type?.message}
          >
            <Input {...register("cuisine_type")} />
          </Field>

          <Field label="Descrizione" error={errors.description?.message}>
            <Textarea {...register("description")} />
          </Field>

          {save.isError ? (
            <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {save.error.message}
            </p>
          ) : null}
          {save.isSuccess && !isDirty ? (
            <p className="text-xs text-success">Salvato.</p>
          ) : null}

          <div>
            <Button type="submit" variant="gold" disabled={save.isPending}>
              {save.isPending
                ? "Salvataggio…"
                : venue
                  ? "Salva modifiche"
                  : "Crea locale"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
