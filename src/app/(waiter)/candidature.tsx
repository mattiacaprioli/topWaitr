import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { formatDate, formatEuro, formatTime, shiftTotal, timeAgo } from "@/lib/format";
import { useMyApplicationsList } from "@/features/applications/hooks";
import type { ApplicationWithShift } from "@/features/applications/api";
import type { Enums } from "@/types/database";

type Status = Enums<"application_status">;
type Filter = "all" | "pending" | "accepted";

// "Rifiutata" è ammorbidita in "Non selezionato" con stile muted (come nel prototipo).
const STATUS_DISPLAY: Record<
  Status,
  { label: string; variant: "pending" | "accepted" | "cancelled"; icon: "clock" | "check" | "close" }
> = {
  pending: { label: "IN ATTESA", variant: "pending", icon: "clock" },
  accepted: { label: "ACCETTATA", variant: "accepted", icon: "check" },
  rejected: { label: "NON SELEZIONATO", variant: "cancelled", icon: "close" },
  cancelled: { label: "RITIRATA", variant: "cancelled", icon: "close" },
};

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-full px-4 py-2",
        active ? "bg-gold" : "border border-border-2"
      )}
    >
      <Text
        className={cn(
          "text-xs font-sans-semibold uppercase",
          active ? "text-gold-ink" : "text-t3"
        )}
        style={{ letterSpacing: 0.6 }}
      >
        {label} · {count}
      </Text>
    </Pressable>
  );
}

function CandidaturaCard({
  app,
  onOpen,
}: {
  app: ApplicationWithShift;
  onOpen: () => void;
}) {
  const shift = app.shift;
  const d = STATUS_DISPLAY[app.status];
  const statusPill = <Pill icon={d.icon} label={d.label} variant={d.variant} />;

  if (!shift) {
    return (
      <Card className="rounded-3xl border-border-2 p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-t3">Turno non più disponibile</Text>
          {statusPill}
        </View>
      </Card>
    );
  }

  const venueName = shift.venue?.name ?? "Locale";
  const total = shiftTotal(shift.hourly_rate, shift.start_time, shift.end_time);
  const subtitle = `${shift.title} · ${formatDate(shift.date)} · ${formatTime(
    shift.start_time
  )}–${formatTime(shift.end_time)}`;

  return (
    <Card className="rounded-3xl border-border-2 p-5" onPress={onOpen}>
      <View className="flex-row items-start gap-3">
        <Avatar uri={shift.venue?.logo_url} name={venueName} size={48} />
        <View className="flex-1">
          <Text className="text-base font-sans-bold text-t1" numberOfLines={1}>
            {venueName}
          </Text>
          <Text className="mt-0.5 text-sm text-t3" numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        {total != null ? (
          <Text className="text-lg font-sans-bold text-gold">
            {formatEuro(total)}
          </Text>
        ) : null}
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-border pt-4">
        {statusPill}
        {app.status === "accepted" ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-sans-semibold text-gold">
              Vedi turno
            </Text>
            <Icon name="chevR" size={15} color="#EAB54C" />
          </View>
        ) : app.status === "pending" ? (
          <Text className="text-sm text-t3">
            Inviata {timeAgo(app.created_at)}
          </Text>
        ) : (
          <Text className="text-sm text-t3">
            {app.status === "cancelled" ? "Ritirata" : "Non selezionato"}
          </Text>
        )}
      </View>
    </Card>
  );
}

export default function WaiterApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const waiterId = session!.user.id;

  const [filter, setFilter] = useState<Filter>("all");
  const appsQuery = useMyApplicationsList(waiterId);
  const apps = appsQuery.data ?? [];

  const pendingCount = apps.filter((a) => a.status === "pending").length;
  const acceptedCount = apps.filter((a) => a.status === "accepted").length;
  const filtered =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  const segs: string[] = [];
  if (pendingCount > 0) segs.push(`${pendingCount} in attesa`);
  if (acceptedCount > 0) segs.push(`${acceptedCount} accettate`);
  const eyebrow = segs.length > 0 ? segs.join(" · ") : `${apps.length} candidature`;

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5 pb-3">
        <ScreenHeader eyebrow={eyebrow} title="Le mie candidature" />
      </View>

      {appsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#EAB54C" />
        </View>
      ) : appsQuery.isError ? (
        <View className="flex-1 justify-center px-6">
          <QueryError onRetry={() => appsQuery.refetch()} />
        </View>
      ) : apps.length === 0 ? (
        <View className="px-5 pt-10" style={{ gap: 24 }}>
          <EmptyState
            title="Nessuna candidatura"
            subtitle="Candidati a un turno per vederlo qui."
          />
          <GoldButton label="Trova turni" onPress={() => router.navigate("/turni")} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 8,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
            gap: 16,
          }}
          refreshControl={
            <RefreshControl
              tintColor="#EAB54C"
              refreshing={appsQuery.isRefetching}
              onRefresh={() => appsQuery.refetch()}
            />
          }
        >
          <View className="flex-row gap-2">
            <FilterChip
              label="Tutte"
              count={apps.length}
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <FilterChip
              label="In attesa"
              count={pendingCount}
              active={filter === "pending"}
              onPress={() => setFilter("pending")}
            />
            <FilterChip
              label="Accettate"
              count={acceptedCount}
              active={filter === "accepted"}
              onPress={() => setFilter("accepted")}
            />
          </View>

          {filtered.length === 0 ? (
            <Text className="mt-8 text-center text-sm text-t3">
              Nessuna candidatura in questo stato.
            </Text>
          ) : (
            filtered.map((app) => (
              <CandidaturaCard
                key={app.id}
                app={app}
                onOpen={() => router.push(`/(waiter)/shift/${app.shift!.id}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
