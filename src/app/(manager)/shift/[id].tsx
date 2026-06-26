import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/providers/Toast";
import { formatDate, formatRate, formatTime } from "@/lib/format";
import { useShift, useUpdateShiftStatus } from "@/features/shifts/hooks";
import { useApplicationDecision, useApplications } from "@/features/applications/hooks";
import type { ApplicationWithWaiter } from "@/features/applications/api";
import type { Enums } from "@/types/database";

const SHIFT_STATUS_LABEL: Record<Enums<"shift_status">, string> = {
  open: "Aperto",
  closed: "Chiuso",
  cancelled: "Annullato",
};

const APP_STATUS_LABEL: Record<Enums<"application_status">, string> = {
  pending: "In attesa",
  accepted: "Accettata",
  rejected: "Rifiutata",
  cancelled: "Ritirata",
};

/** Read-only summary of the applicant's profile data (manager view). */
function ApplicantProfile({
  waiter,
}: {
  waiter: ApplicationWithWaiter["waiter"];
}) {
  const wp = waiter?.waiter_profile ?? null;
  const bio = waiter?.bio ?? null;
  const city = waiter?.city ?? null;
  const experience = wp?.experience ?? null;
  const languages = wp?.languages ?? null;
  const specializations = wp?.specializations ?? null;

  if (!bio && !city && !experience && !languages && !specializations) {
    return null;
  }

  return (
    <View className="mt-3 gap-1.5 border-t border-border pt-3">
      {bio ? <Text className="text-sm text-t2">{bio}</Text> : null}
      {experience ? (
        <Text className="text-sm text-t3">Esperienza: {experience}</Text>
      ) : null}
      {specializations ? (
        <Text className="text-sm text-t3">
          Specializzazioni: {specializations}
        </Text>
      ) : null}
      {languages ? (
        <Text className="text-sm text-t3">Lingue: {languages}</Text>
      ) : null}
      {city ? <Text className="text-sm text-t3">Città: {city}</Text> : null}
    </View>
  );
}

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();

  const shiftQuery = useShift(id);
  const shift = shiftQuery.data ?? null;
  const appsQuery = useApplications(id);
  const applications = appsQuery.data ?? [];

  const decision = useApplicationDecision(id);
  const statusMutation = useUpdateShiftStatus(id, shift?.venue_id);
  const busy = decision.isPending || statusMutation.isPending;

  function onDecision(appId: string, status: Enums<"application_status">) {
    decision.mutate(
      { appId, status },
      {
        onSuccess: () =>
          toast.show(
            status === "accepted"
              ? "Candidatura accettata"
              : "Candidatura rifiutata"
          ),
        onError: () => toast.show("Operazione non riuscita.", "error"),
      }
    );
  }

  function onChangeShiftStatus(status: Enums<"shift_status">) {
    statusMutation.mutate(status, {
      onSuccess: () => toast.show("Turno aggiornato"),
      onError: () => toast.show("Operazione non riuscita.", "error"),
    });
  }

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

  return (
    <ScrollView className="flex-1 bg-bg-1" contentContainerClassName="p-6">
      <Card>
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 text-xl font-sans-bold text-t1">{shift.title}</Text>
          <Pill label={SHIFT_STATUS_LABEL[shift.status]} variant={shift.status} />
        </View>
        <Text className="mt-2 text-sm text-t2">
          {formatDate(shift.date)} · {formatTime(shift.start_time)}–
          {formatTime(shift.end_time)}
        </Text>
        <Text className="mt-1 text-sm text-t2">{formatRate(shift.hourly_rate)}</Text>
        <Text className="mt-1 text-sm text-t3">
          {shift.positions_filled}/{shift.positions_total} posizioni coperte
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

      <View className="mt-4 flex-row gap-3">
        {shift.status === "open" ? (
          <>
            <Pressable
              disabled={busy}
              onPress={() => onChangeShiftStatus("closed")}
              className="flex-1 items-center rounded-xl border border-border bg-bg-2 py-3"
            >
              <Text className="text-sm font-sans-semibold text-t1">Chiudi turno</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => onChangeShiftStatus("cancelled")}
              className="flex-1 items-center rounded-xl border border-border py-3"
            >
              <Text className="text-sm font-sans-semibold text-error">Annulla</Text>
            </Pressable>
          </>
        ) : shift.status === "closed" ? (
          <Pressable
            disabled={busy}
            onPress={() => onChangeShiftStatus("open")}
            className="flex-1 items-center rounded-xl border border-border bg-bg-2 py-3"
          >
            <Text className="text-sm font-sans-semibold text-t1">Riapri turno</Text>
          </Pressable>
        ) : null}
      </View>

      <SectionHeader title="Candidature" className="mt-8" />

      {appsQuery.isError ? (
        <QueryError
          onRetry={() => appsQuery.refetch()}
          subtitle="Non siamo riusciti a caricare le candidature. Riprova."
        />
      ) : applications.length === 0 ? (
        <EmptyState
          title="Nessuna candidatura"
          subtitle="Quando un cameriere si candida lo vedrai qui."
        />
      ) : (
        <View className="gap-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <View className="flex-row items-center gap-3">
                <Avatar
                  uri={app.waiter?.avatar_url ?? undefined}
                  name={app.waiter?.full_name ?? "Cameriere"}
                  size={44}
                />
                <View className="flex-1">
                  <Text className="text-base font-sans-bold text-t1">
                    {app.waiter?.full_name ?? "Cameriere"}
                  </Text>
                  {app.waiter?.waiter_profile?.primary_role ? (
                    <Text className="text-xs text-t3">
                      {app.waiter.waiter_profile.primary_role}
                    </Text>
                  ) : null}
                  <Pill label={APP_STATUS_LABEL[app.status]} variant={app.status} />
                </View>
              </View>

              {app.message ? (
                <Text className="mt-3 text-sm text-t2">{app.message}</Text>
              ) : null}

              <ApplicantProfile waiter={app.waiter} />

              {app.status === "pending" ? (
                <View className="mt-3 flex-row gap-3">
                  <Pressable
                    disabled={busy}
                    onPress={() => onDecision(app.id, "accepted")}
                    className="flex-1 items-center rounded-xl bg-success py-2.5"
                  >
                    <Text className="text-sm font-sans-semibold text-bg-1">Accetta</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => onDecision(app.id, "rejected")}
                    className="flex-1 items-center rounded-xl border border-border py-2.5"
                  >
                    <Text className="text-sm font-sans-semibold text-error">Rifiuta</Text>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
