import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { useMyVenue } from "@/features/venues/hooks";
import { useCreateShift } from "@/features/shifts/hooks";
import { ShiftFormView } from "@/features/shifts/ShiftFormView";
import { formToShiftFields } from "@/features/shifts/form";
import type { ShiftForm } from "@/features/shifts/schema";

function defaultTime(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

export default function NewShiftScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const userId = session!.user.id;

  const venueQuery = useMyVenue(userId);
  const venueId = venueQuery.data?.id;
  const create = useCreateShift(venueId);

  const onSubmit = (values: ShiftForm) => {
    if (!venueId) {
      toast.show("Configura prima il tuo locale.", "error");
      return;
    }
    create.mutate(
      { venue_id: venueId, ...formToShiftFields(values) },
      {
        onSuccess: () => {
          toast.show("Turno pubblicato");
          router.back();
        },
        onError: () =>
          toast.show("Impossibile pubblicare il turno. Riprova.", "error"),
      }
    );
  };

  return (
    <ShiftFormView
      defaultValues={{
        title: "",
        date: new Date(),
        start: defaultTime(18),
        end: defaultTime(23),
        positions: "1",
        rate: "",
        dressCode: "",
        requirements: "",
        description: "",
      }}
      submitLabel="Pubblica turno"
      pendingLabel="Pubblicazione…"
      pending={create.isPending}
      onSubmit={onSubmit}
    />
  );
}
