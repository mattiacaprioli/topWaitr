import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { GoldButton } from "@/components/ui/GoldButton";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ControlledInput } from "@/components/form/ControlledInput";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { formatDate, formatRate, formatTime } from "@/lib/format";
import { useShiftWithVenue } from "@/features/shifts/hooks";
import { useApply, useMyApplication } from "@/features/applications/hooks";
import {
  applicationSchema,
  type ApplicationForm,
} from "@/features/applications/schema";
import type { Enums } from "@/types/database";

const APP_STATUS_LABEL: Record<Enums<"application_status">, string> = {
  pending: "In attesa",
  accepted: "Accettata",
  rejected: "Rifiutata",
  cancelled: "Ritirata",
};

export default function WaiterShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const waiterId = session!.user.id;
  const toast = useToast();

  const shiftQuery = useShiftWithVenue(id);
  const shift = shiftQuery.data ?? null;
  const myAppQuery = useMyApplication(id, waiterId);
  const myApp = myAppQuery.data ?? null;
  const apply = useApply(id, waiterId);

  const { control, handleSubmit, reset } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apply.mutateAsync(values.message);
      toast.show("Candidatura inviata");
      reset();
    } catch {
      toast.show("Impossibile inviare la candidatura. Riprova.", "error");
    }
  });

  if (shiftQuery.isLoading || myAppQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-0">
        <ActivityIndicator color="#EAB54C" />
      </View>
    );
  }

  if (shiftQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-bg-0 px-6">
        <QueryError onRetry={() => shiftQuery.refetch()} />
      </View>
    );
  }

  if (!shift) {
    return (
      <View className="flex-1 bg-bg-0">
        <EmptyState
          title="Turno non trovato"
          subtitle="Questo turno non è più disponibile."
        />
      </View>
    );
  }

  const remaining = Math.max(0, shift.positions_total - shift.positions_filled);
  const isOpen = shift.status === "open";
  const isFull = remaining === 0;
  // Una candidatura ritirata (cancelled) può essere reinviata.
  const hasActiveApp = myApp != null && myApp.status !== "cancelled";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerClassName="p-6"
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text className="text-xl font-sans-bold text-t1">{shift.title}</Text>
          {shift.venue ? (
            <Text className="mt-1 text-sm text-t2">
              {shift.venue.name}
              {shift.venue.city ? ` · ${shift.venue.city}` : ""}
            </Text>
          ) : null}
          <Text className="mt-2 text-sm text-t2">
            {formatDate(shift.date)} · {formatTime(shift.start_time)}–
            {formatTime(shift.end_time)}
          </Text>
          <Text className="mt-1 text-sm text-t2">
            {formatRate(shift.hourly_rate)}
          </Text>
          <Text className="mt-1 text-sm text-t3">
            {remaining > 0
              ? `${remaining} posti disponibili`
              : "Turno al completo"}
          </Text>

          {shift.dress_code ? (
            <Text className="mt-3 text-sm text-t2">
              Dress code: {shift.dress_code}
            </Text>
          ) : null}
          {shift.requirements && shift.requirements.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {shift.requirements.map((r) => (
                <Pill key={r} label={r} variant="neutral" />
              ))}
            </View>
          ) : null}
          {shift.description ? (
            <Text className="mt-3 text-sm text-t2">{shift.description}</Text>
          ) : null}
        </Card>

        <SectionHeader title="Candidatura" className="mt-8" />

        {hasActiveApp ? (
          <Card>
            <Text className="text-sm text-t2">
              Ti sei candidato a questo turno.
            </Text>
            <View className="mt-2 flex-row">
              <Pill label={APP_STATUS_LABEL[myApp!.status]} variant={myApp!.status} />
            </View>
            {myApp!.message ? (
              <Text className="mt-3 text-sm text-t3">{myApp!.message}</Text>
            ) : null}
          </Card>
        ) : !isOpen ? (
          <EmptyState
            title="Turno non disponibile"
            subtitle="Questo turno non accetta più candidature."
          />
        ) : isFull ? (
          <EmptyState
            title="Turno al completo"
            subtitle="Tutte le posizioni sono già coperte."
          />
        ) : (
          <View className="gap-4">
            <ControlledInput
              control={control}
              name="message"
              label="Messaggio (facoltativo)"
              placeholder="Presentati al ristoratore…"
              multiline
              numberOfLines={4}
              className="h-28"
              textAlignVertical="top"
            />
            <GoldButton
              label={apply.isPending ? "Invio…" : "Candidati"}
              disabled={apply.isPending}
              onPress={onSubmit}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
