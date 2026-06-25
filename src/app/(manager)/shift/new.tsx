import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, Text } from "@/tw";
import { ControlledInput } from "@/components/form/ControlledInput";
import { ControlledPicker } from "@/components/form/ControlledPicker";
import { GoldButton } from "@/components/ui/GoldButton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { toDateString, toTimeString } from "@/lib/format";
import { useMyVenue } from "@/features/venues/hooks";
import { useCreateShift } from "@/features/shifts/hooks";
import { shiftSchema, type ShiftForm } from "@/features/shifts/schema";

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

  const { control, handleSubmit } = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      start: defaultTime(18),
      end: defaultTime(23),
      positions: "1",
      rate: "",
      dressCode: "",
      requirements: "",
      description: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!venueId) {
      toast.show("Configura prima il tuo locale.", "error");
      return;
    }
    const rateNum = values.rate.trim()
      ? parseFloat(values.rate.replace(",", "."))
      : null;
    try {
      await create.mutateAsync({
        venue_id: venueId,
        title: values.title,
        date: toDateString(values.date),
        start_time: toTimeString(values.start),
        end_time: toTimeString(values.end),
        positions_total: Math.max(1, parseInt(values.positions, 10) || 1),
        hourly_rate: rateNum,
        dress_code: values.dressCode || null,
        description: values.description || null,
        requirements: values.requirements
          ? values.requirements
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean)
          : null,
      });
      toast.show("Turno pubblicato");
      router.back();
    } catch {
      toast.show("Impossibile pubblicare il turno. Riprova.", "error");
    }
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-1"
        contentContainerClassName="p-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <ControlledInput
          control={control}
          name="title"
          label="Titolo"
          placeholder="Cameriere di sala — serata"
        />

        <ControlledPicker control={control} name="date" label="Data" mode="date" />
        <ControlledPicker control={control} name="start" label="Inizio" mode="time" />
        <ControlledPicker control={control} name="end" label="Fine" mode="time" />

        <ControlledInput
          control={control}
          name="positions"
          label="Posizioni"
          keyboardType="number-pad"
          placeholder="1"
        />
        <ControlledInput
          control={control}
          name="rate"
          label="Paga oraria (€)"
          keyboardType="decimal-pad"
          placeholder="Opzionale — es. 10,50"
        />
        <ControlledInput
          control={control}
          name="dressCode"
          label="Dress code"
          placeholder="Opzionale — es. camicia nera"
        />
        <ControlledInput
          control={control}
          name="requirements"
          label="Requisiti"
          placeholder="Separati da virgola"
        />
        <ControlledInput
          control={control}
          name="description"
          label="Descrizione"
          placeholder="Dettagli del turno"
          multiline
          numberOfLines={4}
          className="h-28"
          textAlignVertical="top"
        />

        <GoldButton
          className="mt-2"
          label={create.isPending ? "Pubblicazione…" : "Pubblica turno"}
          disabled={create.isPending}
          onPress={onSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
