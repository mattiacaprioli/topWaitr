import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Display } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Mono } from "@/components/ui/Mono";
import { Pill } from "@/components/ui/Pill";
import { QueryError } from "@/components/ui/QueryError";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { formatDate, formatEuro, formatRate, formatTime, shiftTotal } from "@/lib/format";
import { useOpenShifts } from "@/features/shifts/hooks";
import { useApply, useMyApplications } from "@/features/applications/hooks";
import { useToast } from "@/providers/Toast";
import type { Enums } from "@/types/database";
import type { ShiftWithVenue } from "@/features/shifts/types";

const APP_STATUS_LABEL: Record<Enums<"application_status">, string> = {
  pending: "in attesa",
  accepted: "accettata",
  rejected: "rifiutata",
  cancelled: "ritirata",
};

type SortKey = "data" | "pay";

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-full px-4 py-2",
        active ? "bg-bg-2 border border-border" : ""
      )}
    >
      <Text
        className={cn(
          "text-sm font-sans-semibold",
          active ? "text-t1" : "text-t3"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ShiftCard({
  shift,
  waiterId,
  status,
  onOpen,
}: {
  shift: ShiftWithVenue;
  waiterId: string;
  status?: Enums<"application_status">;
  onOpen: () => void;
}) {
  const toast = useToast();
  const apply = useApply(shift.id, waiterId);

  const venueName = shift.venue?.name ?? "Locale";
  const total = shiftTotal(shift.hourly_rate, shift.start_time, shift.end_time);
  const remaining = Math.max(0, shift.positions_total - shift.positions_filled);
  const requirements = shift.requirements ?? [];
  const applied = status != null && status !== "cancelled";
  const full = remaining === 0;

  function onApply() {
    apply.mutate(undefined, {
      onSuccess: () => toast.show("Candidatura inviata"),
      onError: () =>
        toast.show("Impossibile inviare la candidatura. Riprova.", "error"),
    });
  }

  return (
    <Card className="rounded-3xl border-border-2 p-5">
      <Pressable onPress={onOpen}>
        <View className="flex-row items-start gap-3">
          <Avatar uri={shift.venue?.logo_url} name={venueName} size={48} />
          <View className="flex-1">
            <Text
              className="text-base font-sans-bold text-t1"
              numberOfLines={1}
            >
              {venueName}
            </Text>
            <Text className="mt-0.5 text-sm text-t3" numberOfLines={1}>
              {shift.title}
            </Text>
          </View>
          <View className="items-end">
            {total != null ? (
              <>
                <Text className="text-xl font-sans-bold text-gold">
                  {formatEuro(total)}
                </Text>
                <Text className="mt-0.5 text-[11px] text-t3">
                  {formatRate(shift.hourly_rate)}
                </Text>
              </>
            ) : (
              <Mono gold>Da concordare</Mono>
            )}
          </View>
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <Icon name="calendar" size={15} color="#8c857a" />
          <Text className="text-sm text-t2">
            {formatDate(shift.date)} · {formatTime(shift.start_time)}–
            {formatTime(shift.end_time)}
          </Text>
        </View>

        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <Text className="text-sm font-sans-semibold text-t2">
            {remaining} posti
          </Text>
          {requirements.slice(0, 3).map((r) => (
            <Pill key={r} label={`✓ ${r.toUpperCase()}`} variant="tag" />
          ))}
        </View>
      </Pressable>

      <View className="mt-4">
        {applied ? (
          <View className="items-center rounded-full border border-border bg-bg-2 py-3">
            <Text className="text-sm font-sans-semibold text-t2">
              Candidatura {APP_STATUS_LABEL[status!]}
            </Text>
          </View>
        ) : full ? (
          <View className="items-center rounded-full border border-border py-3 opacity-60">
            <Text className="text-sm font-sans-semibold text-t3">
              Turno al completo
            </Text>
          </View>
        ) : (
          <GoldButton
            label={apply.isPending ? "Invio…" : "Candidati"}
            disabled={apply.isPending}
            onPress={onApply}
          />
        )}
      </View>
    </Card>
  );
}

export default function WaiterShiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const waiterId = session!.user.id;

  const [sort, setSort] = useState<SortKey>("data");
  const shiftsQuery = useOpenShifts();
  const myAppsQuery = useMyApplications(waiterId);

  const shifts = useMemo(() => shiftsQuery.data ?? [], [shiftsQuery.data]);
  const statusByShift = useMemo(() => {
    const m = new Map<string, Enums<"application_status">>();
    for (const a of myAppsQuery.data ?? []) m.set(a.shift_id, a.status);
    return m;
  }, [myAppsQuery.data]);

  const sorted = useMemo(() => {
    if (sort !== "pay") return shifts;
    return [...shifts].sort(
      (a, b) =>
        (shiftTotal(b.hourly_rate, b.start_time, b.end_time) ?? -1) -
        (shiftTotal(a.hourly_rate, a.start_time, a.end_time) ?? -1)
    );
  }, [shifts, sort]);

  if (shiftsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-0">
        <ActivityIndicator color="#EAB54C" />
      </View>
    );
  }

  if (shiftsQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-bg-0 px-6">
        <QueryError onRetry={() => shiftsQuery.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 96,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={shiftsQuery.isRefetching}
          onRefresh={() => shiftsQuery.refetch()}
        />
      }
    >
      <View>
        <Mono gold>{shifts.length} turni aperti</Mono>
        <Display className="mt-1 text-4xl">Trova turni</Display>
      </View>

      {shifts.length > 0 ? (
        <View className="flex-row gap-2">
          <SortChip
            label="Per data"
            active={sort === "data"}
            onPress={() => setSort("data")}
          />
          <SortChip
            label="Più pagati"
            active={sort === "pay"}
            onPress={() => setSort("pay")}
          />
        </View>
      ) : null}

      {sorted.length === 0 ? (
        <View className="mt-10">
          <EmptyState
            title="Nessun turno disponibile"
            subtitle="Al momento non ci sono turni aperti. Torna più tardi."
          />
        </View>
      ) : (
        sorted.map((shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            waiterId={waiterId}
            status={statusByShift.get(shift.id)}
            onOpen={() => router.push(`/(waiter)/shift/${shift.id}`)}
          />
        ))
      )}
    </ScrollView>
  );
}
