import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { View } from "@/tw";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { useToast } from "@/providers/Toast";
import { useShift, useUpdateShift } from "@/features/shifts/hooks";
import { ShiftFormView } from "@/features/shifts/ShiftFormView";
import { formToShiftFields, shiftToForm } from "@/features/shifts/form";
import type { ShiftForm } from "@/features/shifts/schema";

export default function EditShiftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const shiftQuery = useShift(id);
  const shift = shiftQuery.data ?? null;
  const update = useUpdateShift(id, shift?.venue_id);

  if (shiftQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-1">
        <ActivityIndicator color="#EAB54C" />
      </View>
    );
  }

  if (shiftQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-bg-1 px-6">
        <QueryError onRetry={() => shiftQuery.refetch()} />
      </View>
    );
  }

  if (!shift) {
    return (
      <View className="flex-1 bg-bg-1">
        <EmptyState
          title="Turno non trovato"
          subtitle="Questo turno non è più disponibile."
        />
      </View>
    );
  }

  const onSubmit = (values: ShiftForm) => {
    update.mutate(formToShiftFields(values), {
      onSuccess: () => {
        toast.show("Turno aggiornato");
        router.back();
      },
      onError: () =>
        toast.show("Impossibile salvare le modifiche. Riprova.", "error"),
    });
  };

  return (
    <ShiftFormView
      defaultValues={shiftToForm(shift)}
      submitLabel="Salva modifiche"
      pendingLabel="Salvataggio…"
      pending={update.isPending}
      onSubmit={onSubmit}
    />
  );
}
