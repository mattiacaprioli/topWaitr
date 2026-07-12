import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { Mono } from "@/components/ui/Mono";
import { Pill } from "@/components/ui/Pill";
import { QueryError } from "@/components/ui/QueryError";
import { ControlledInput } from "@/components/form/ControlledInput";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { formatDate, formatEuro, formatRate, formatTime, shiftTotal } from "@/lib/format";
import { useShiftWithVenue } from "@/features/shifts/hooks";
import {
  useApply,
  useCancelApplication,
  useMyApplication,
} from "@/features/applications/hooks";
import {
  useMyAssignmentForShift,
  useRespondToAssignment,
} from "@/features/assignments/hooks";
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

const ASSIGN_STATUS_LABEL: Record<Enums<"assignment_status">, string> = {
  assigned: "Da confermare",
  confirmed: "Confermato",
  declined: "Rifiutato",
};

function InfoRow({
  label,
  value,
  gold,
  first,
}: {
  label: string;
  value: string;
  gold?: boolean;
  first?: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center justify-between py-3.5",
        !first && "border-t border-border"
      )}
    >
      <Text className="shrink-0 text-sm text-t3">{label}</Text>
      <Text
        className={cn(
          "ml-3 flex-1 text-right text-sm font-sans-semibold",
          gold ? "text-gold" : "text-t1"
        )}
      >
        {value}
      </Text>
    </View>
  );
}

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
  const cancel = useCancelApplication();
  const myAssignmentQuery = useMyAssignmentForShift(id, waiterId);
  const myAssignment = myAssignmentQuery.data ?? null;
  const respond = useRespondToAssignment();

  function onRespond(status: Enums<"assignment_status">) {
    if (!myAssignment) return;
    respond.mutate(
      { id: myAssignment.id, status },
      {
        onSuccess: () =>
          toast.show(
            status === "confirmed" ? "Presenza confermata" : "Turno rifiutato"
          ),
        onError: () => toast.show("Operazione non riuscita. Riprova.", "error"),
      }
    );
  }

  function confirmDecline() {
    Alert.alert("Rifiutare il turno?", "Il ristoratore verrà avvisato.", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Rifiuta",
        style: "destructive",
        onPress: () => onRespond("declined"),
      },
    ]);
  }

  function confirmWithdraw() {
    if (!myApp) return;
    Alert.alert(
      "Ritira candidatura",
      "Vuoi ritirare la candidatura per questo turno?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Ritira",
          style: "destructive",
          onPress: () =>
            cancel.mutate(myApp.id, {
              onSuccess: () => toast.show("Candidatura ritirata"),
              onError: () =>
                toast.show(
                  "Impossibile ritirare la candidatura. Riprova.",
                  "error"
                ),
            }),
        },
      ]
    );
  }

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

  if (shiftQuery.isLoading || myAppQuery.isLoading || myAssignmentQuery.isLoading) {
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

  const internal = shift.kind === "internal";
  const venueName = shift.venue?.name ?? "Locale";
  const total = shiftTotal(shift.hourly_rate, shift.start_time, shift.end_time);
  const remaining = Math.max(0, shift.positions_total - shift.positions_filled);
  const requirements = shift.requirements ?? [];
  const isOpen = shift.status === "open";
  const isFull = remaining === 0;
  const hasActiveApp = myApp != null && myApp.status !== "cancelled";

  const compenso =
    total != null
      ? `${formatEuro(total)} · ${formatRate(shift.hourly_rate)}`
      : formatRate(shift.hourly_rate);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerClassName="px-5 pb-12 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-3.5">
          <View
            style={{
              borderWidth: 2,
              borderColor: "rgba(234,181,76,0.5)",
              borderRadius: 999,
              padding: 2,
            }}
          >
            <Avatar uri={shift.venue?.logo_url} name={venueName} size={52} />
          </View>
          <View className="flex-1">
            <Display className="text-2xl">{venueName}</Display>
            <Text className="mt-0.5 text-sm text-t3">{shift.title}</Text>
          </View>
        </View>

        <Card className="mt-6 rounded-3xl border-border-2 px-5 py-1">
          <InfoRow
            first
            label="Quando"
            value={`${formatDate(shift.date)} · ${formatTime(
              shift.start_time
            )}–${formatTime(shift.end_time)}`}
          />
          {internal ? null : (
            <>
              <InfoRow label="Compenso" value={compenso} gold />
              <InfoRow
                label="Posti"
                value={`${remaining} di ${shift.positions_total} disponibili`}
              />
            </>
          )}
          {shift.dress_code ? (
            <InfoRow label="Dress code" value={shift.dress_code} />
          ) : null}
        </Card>

        {requirements.length > 0 ? (
          <View className="mt-6">
            <Mono className="mb-2">Requisiti</Mono>
            <View className="flex-row flex-wrap gap-2">
              {requirements.map((r) => (
                <Pill key={r} label={`✓ ${r.toUpperCase()}`} variant="tag" />
              ))}
            </View>
          </View>
        ) : null}

        {shift.description ? (
          <View className="mt-6">
            <Mono className="mb-2">Descrizione</Mono>
            <Text className="text-sm leading-5 text-t2">{shift.description}</Text>
          </View>
        ) : null}

        {internal ? (
          <>
            <Mono className="mb-3 mt-8">Turno dello staff</Mono>
            {myAssignment ? (
              <Card className="rounded-3xl border-border-2 p-5">
                <Text className="text-sm text-t2">
                  Sei stato assegnato a questo turno da {venueName}.
                </Text>
                <View className="mt-2 flex-row">
                  <Pill
                    label={ASSIGN_STATUS_LABEL[myAssignment.status]}
                    variant={
                      myAssignment.status === "confirmed"
                        ? "accepted"
                        : myAssignment.status === "declined"
                          ? "cancelled"
                          : "pending"
                    }
                  />
                </View>
                {myAssignment.status === "assigned" ? (
                  <View className="mt-4 gap-2.5">
                    <GoldButton
                      label={respond.isPending ? "Attendere…" : "Conferma presenza"}
                      disabled={respond.isPending}
                      onPress={() => onRespond("confirmed")}
                    />
                    <GhostButton
                      label="Non posso"
                      disabled={respond.isPending}
                      onPress={confirmDecline}
                    />
                  </View>
                ) : myAssignment.status === "confirmed" ? (
                  <Text className="mt-3 text-sm text-t3">
                    Hai confermato la presenza. A presto!
                  </Text>
                ) : (
                  <View className="mt-3 gap-2.5">
                    <Text className="text-sm text-t3">
                      Hai rifiutato questo turno.
                    </Text>
                    <GhostButton
                      label="Ci sono, conferma"
                      disabled={respond.isPending}
                      onPress={() => onRespond("confirmed")}
                    />
                  </View>
                )}
              </Card>
            ) : (
              <Card className="rounded-3xl border-border-2 p-5">
                <Text className="text-sm text-t3">
                  Questo è un turno riservato allo staff del locale.
                </Text>
              </Card>
            )}
          </>
        ) : (
          <>
            <Mono className="mb-3 mt-8">Candidatura</Mono>

            {hasActiveApp ? (
          <Card className="rounded-3xl border-border-2 p-5">
            <Text className="text-sm text-t2">
              Ti sei candidato a questo turno.
            </Text>
            <View className="mt-2 flex-row">
              <Pill label={APP_STATUS_LABEL[myApp!.status]} variant={myApp!.status} />
            </View>
            {myApp!.message ? (
              <Text className="mt-3 text-sm text-t3">{myApp!.message}</Text>
            ) : null}
            {myApp!.status === "pending" ? (
              <GhostButton
                className="mt-4"
                label={cancel.isPending ? "Ritiro…" : "Ritira candidatura"}
                disabled={cancel.isPending}
                onPress={confirmWithdraw}
              />
            ) : null}
          </Card>
        ) : !isOpen ? (
          <Card className="rounded-3xl border-border-2 p-5">
            <Text className="text-sm text-t3">
              Questo turno non accetta più candidature.
            </Text>
          </Card>
        ) : isFull ? (
          <Card className="rounded-3xl border-border-2 p-5">
            <Text className="text-sm text-t3">
              Tutte le posizioni sono già coperte.
            </Text>
          </Card>
        ) : (
          <Card className="rounded-3xl border-border-2 p-5">
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
            <Text className="mt-3 text-xs leading-4 text-t3">
              Candidandoti, il ristoratore potrà vedere il tuo profilo e
              accettarti.
            </Text>
            <GoldButton
              className="mt-4"
              label={apply.isPending ? "Invio…" : "Conferma candidatura"}
              disabled={apply.isPending}
              onPress={onSubmit}
            />
          </Card>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
