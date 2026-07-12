import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { QueryError } from "@/components/ui/QueryError";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { StatCard } from "@/components/ui/StatCard";
import { ManagerShiftCard } from "@/features/shifts/ManagerShiftCard";
import { useAuth } from "@/lib/auth";
import { formatTime } from "@/lib/format";
import { useMyVenue } from "@/features/venues/hooks";
import { useMyShifts } from "@/features/shifts/hooks";
import { usePendingCount, useTodayStaff } from "@/features/applications/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";

const PREVIEW_COUNT = 3;

export default function ManagerHome() {
  const { profile, session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = session!.user.id;
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Ristoratore";

  const venueQuery = useMyVenue(userId);
  const venue = venueQuery.data ?? null;
  const shiftsQuery = useMyShifts(venue?.id);
  const shifts = shiftsQuery.data ?? [];
  const staffQuery = useTodayStaff(venue?.id);
  const todayStaff = staffQuery.data ?? [];
  const pending = usePendingCount(venue?.id).data ?? 0;
  const unread = useUnreadCount(userId).data ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = shifts.filter((s) => s.date >= today);
  const past = shifts.filter((s) => s.date < today);
  const openCount = upcoming.filter((s) => s.status === "open").length;
  const filled = upcoming.reduce((n, s) => n + s.positions_filled, 0);
  const totalPos = upcoming.reduce((n, s) => n + s.positions_total, 0);

  const refreshing =
    venueQuery.isRefetching ||
    shiftsQuery.isRefetching ||
    staffQuery.isRefetching;
  const onRefresh = () => {
    venueQuery.refetch();
    shiftsQuery.refetch();
    staffQuery.refetch();
  };

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 96,
        gap: 24,
      }}
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Mono gold>La tua area</Mono>
          <Display className="mt-1 text-4xl">Ciao, {firstName}</Display>
          {venue ? (
            <Text className="mt-1 text-sm text-t3">{venue.name}</Text>
          ) : null}
        </View>
        <NotificationBell
          count={unread}
          onPress={() => router.push("/(manager)/notifiche")}
        />
      </View>

      {venueQuery.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-16" />
      ) : venueQuery.isError ? (
        <QueryError className="mt-10" onRetry={() => venueQuery.refetch()} />
      ) : !venue ? (
        <View className="mt-6">
          <EmptyState
            title="Configura il tuo locale"
            subtitle="Aggiungi le informazioni del tuo ristorante per iniziare a pubblicare turni."
          />
          <GoldButton
            className="mt-2"
            label="Configura locale"
            onPress={() => router.push("/(manager)/venue")}
          />
        </View>
      ) : shiftsQuery.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-10" />
      ) : (
        <>
          {/* A colpo d'occhio */}
          <View className="gap-2.5">
            <Mono>A colpo d&apos;occhio</Mono>
            <View className="flex-row gap-2.5">
              <StatCard value={String(openCount)} label="turni aperti" />
              <StatCard value={String(pending)} label="da valutare" />
            </View>
            <View className="flex-row gap-2.5">
              <StatCard
                value={totalPos > 0 ? `${filled}/${totalPos}` : "—"}
                label="posti coperti"
              />
              <StatCard value={String(past.length)} label="turni svolti" />
            </View>
          </View>

          {/* Chi lavora oggi */}
          {todayStaff.length > 0 ? (
            <View className="gap-3">
              <View>
                <Mono gold>Oggi in sala · {todayStaff.length}</Mono>
                <Display className="mt-0.5 text-2xl">Chi lavora oggi</Display>
              </View>
              <View className="gap-3">
                {todayStaff.map((row) => (
                  <Card
                    key={row.id}
                    className="rounded-3xl border-border-2 p-4"
                    onPress={() =>
                      router.push(`/(manager)/cameriere/${row.waiter_id}`)
                    }
                  >
                    <View className="flex-row items-center gap-3">
                      <Avatar
                        uri={row.waiter?.avatar_url ?? undefined}
                        name={row.waiter?.full_name ?? "Cameriere"}
                        size={44}
                      />
                      <View className="flex-1">
                        <Text className="text-base font-sans-bold text-t1">
                          {row.waiter?.full_name ?? "Cameriere"}
                        </Text>
                        {row.waiter?.waiter_profile?.primary_role ? (
                          <Text className="text-xs text-t3">
                            {row.waiter.waiter_profile.primary_role}
                          </Text>
                        ) : null}
                        <RatingBadge
                          avg={row.waiter?.waiter_profile?.rating_avg ?? null}
                          count={
                            row.waiter?.waiter_profile?.rating_count ?? null
                          }
                          className="mt-1"
                        />
                      </View>
                      {row.shift ? (
                        <View className="flex-row items-center gap-1.5">
                          <Icon name="clock" size={14} color="#8c857a" />
                          <Text className="text-sm text-t2">
                            {formatTime(row.shift.start_time)}–
                            {formatTime(row.shift.end_time)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          {/* Prossimi turni */}
          <View className="gap-3">
            <View className="flex-row items-end justify-between gap-3">
              <View className="flex-1">
                <Mono>I tuoi turni</Mono>
                <Display className="mt-0.5 text-2xl">Prossimi turni</Display>
              </View>
              {shifts.length > 0 ? (
                <Pressable
                  onPress={() => router.push("/(manager)/(tabs)/turni")}
                  hitSlop={8}
                >
                  <Text className="text-sm font-sans-semibold text-gold">
                    Vedi tutti
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {shiftsQuery.isError ? (
              <QueryError
                onRetry={() => shiftsQuery.refetch()}
                subtitle="Non siamo riusciti a caricare i turni. Riprova."
              />
            ) : upcoming.length === 0 ? (
              <EmptyState
                title="Nessun turno in programma"
                subtitle="Pubblica un turno dalla scheda «Turni»."
              />
            ) : (
              <View className="gap-3">
                {upcoming.slice(0, PREVIEW_COUNT).map((shift) => (
                  <ManagerShiftCard
                    key={shift.id}
                    shift={shift}
                    onPress={() => router.push(`/(manager)/shift/${shift.id}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
