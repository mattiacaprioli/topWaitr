import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
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

/** Stato a tutta pagina con back circolare + contenuto centrato (loading/errore/non trovato). */
function GuardScreen({ children }: { children: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-12 w-12 items-center justify-center rounded-full border border-border-2 bg-bg-2"
        >
          <Icon name="chevL" size={22} color="#F8F4ED" />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center px-6">{children}</View>
    </View>
  );
}

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
  no_show: "Assente",
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [declineVisible, setDeclineVisible] = useState(false);

  /** Conferma presenza (o ri-conferma dopo un rifiuto). */
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

  function doDecline() {
    if (!myAssignment) return;
    respond.mutate(
      { id: myAssignment.id, status: "declined" },
      {
        onSuccess: () => {
          setDeclineVisible(false);
          toast.show("Turno rifiutato");
        },
        onError: () => {
          setDeclineVisible(false);
          toast.show("Operazione non riuscita. Riprova.", "error");
        },
      }
    );
  }

  function doWithdraw() {
    if (!myApp) return;
    cancel.mutate(myApp.id, {
      onSuccess: () => {
        setWithdrawVisible(false);
        toast.show("Candidatura ritirata");
      },
      onError: () => {
        setWithdrawVisible(false);
        toast.show("Impossibile ritirare la candidatura. Riprova.", "error");
      },
    });
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
      <GuardScreen>
        <ActivityIndicator color="#EAB54C" />
      </GuardScreen>
    );
  }

  if (shiftQuery.isError) {
    return (
      <GuardScreen>
        <QueryError onRetry={() => shiftQuery.refetch()} />
      </GuardScreen>
    );
  }

  if (!shift) {
    return (
      <GuardScreen>
        <EmptyState
          title="Turno non trovato"
          subtitle="Questo turno non è più disponibile."
        />
      </GuardScreen>
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
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="mb-5 h-11 w-11 items-center justify-center rounded-full border border-border-2 bg-bg-2"
        >
          <Icon name="chevL" size={22} color="#F8F4ED" />
        </Pressable>

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
                      onPress={() => setDeclineVisible(true)}
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
                onPress={() => setWithdrawVisible(true)}
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

      <ConfirmModal
        visible={withdrawVisible}
        title="Ritirare la candidatura?"
        message="Non risulterai più tra i candidati per questo turno."
        confirmLabel="Ritira"
        destructive
        pending={cancel.isPending}
        onConfirm={doWithdraw}
        onCancel={() => setWithdrawVisible(false)}
      />
      <ConfirmModal
        visible={declineVisible}
        title="Rifiutare il turno?"
        message="Il ristoratore verrà avvisato."
        confirmLabel="Rifiuta"
        destructive
        pending={respond.isPending}
        onConfirm={doDecline}
        onCancel={() => setDeclineVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
