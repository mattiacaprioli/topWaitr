import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyboardAvoidingView } from "react-native";
import { ScrollView, Text } from "@/tw";
import { ControlledInput } from "@/components/form/ControlledInput";
import { ControlledPicker } from "@/components/form/ControlledPicker";
import { GoldButton } from "@/components/ui/GoldButton";
import { formatShiftSummary, toDateString, toTimeString } from "@/lib/format";
import { shiftSchema, type ShiftForm } from "./schema";

type Props = {
  defaultValues: ShiftForm;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  onSubmit: (values: ShiftForm) => void;
};

/** Form condiviso per creare e modificare un turno (stessi campi + validazione). */
export function ShiftFormView({
  defaultValues,
  submitLabel,
  pendingLabel,
  pending,
  onSubmit,
}: Props) {
  const { control, handleSubmit, watch } = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    defaultValues,
  });

  // Riepilogo dal vivo: su un turno notturno è l'unica cosa che dice che la
  // fine cade il giorno dopo.
  const date = watch("date");
  const start = watch("start");
  const end = watch("end");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
    >
      <ScrollView
        className="flex-1 bg-bg-0"
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

        {date && start && end ? (
          <Text className="-mt-1 text-xs text-t3">
            {formatShiftSummary(
              toDateString(date),
              toTimeString(start),
              toTimeString(end)
            )}
          </Text>
        ) : null}

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
          label={pending ? pendingLabel : submitLabel}
          disabled={pending}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
