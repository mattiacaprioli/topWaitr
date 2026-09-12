import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { QueryError } from "@/components/ui/QueryError";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useMyAssignedUpcoming } from "@/features/assignments/hooks";
import { useMyWorkHistoryTotals } from "@/features/assignments/history";
import { MyShiftCard } from "@/features/assignments/MyShiftCard";
import { useMyPendingInvites } from "@/features/staff/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { useAuth } from "@/lib/auth";
import { formatHours } from "@/lib/format";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WaiterHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const waiterId = session!.user.id;

  const assignedQuery = useMyAssignedUpcoming(waiterId);
  const pendingInvites = useMyPendingInvites(waiterId).data ?? [];
  const totals = useMyWorkHistoryTotals(waiterId);
  const unread = useUnreadCount(waiterId).data ?? 0;
  const pull = usePullToRefresh(() =>
    Promise.all([assignedQuery.refetch(), totals.refetch()])
  );

  const upcomingItems = (assignedQuery.data ?? []).filter(
    (a) => a.shift != null
  );
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Cameriere";

  // Quanti turni deve ancora confermare: è la sola cosa in questa schermata su
  // cui c'è qualcosa da fare, quindi ha una cella sua.
  const daConfermare = upcomingItems.filter(
    (a) => a.status === "assigned"
  ).length;

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 96,
        gap: 20,
      }}
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={pull.refreshing}
          onRefresh={pull.onRefresh}
        />
      }
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Mono gold>La tua area</Mono>
          <Display className="mt-1 text-4xl">Ciao, {firstName}</Display>
        </View>
        <NotificationBell
          count={unread}
          onPress={() => router.push("/(waiter)/notifiche")}
        />
      </View>

      {pendingInvites.length > 0 ? (
        <Pressable onPress={() => router.push("/(waiter)/inviti")}>
          <View className="flex-row items-center gap-3 rounded-3xl border border-border-2 bg-bg-2 p-4">
            <Icon name="users" size={20} color="#EAB54C" />
            <View className="flex-1">
              <Text className="text-sm font-sans-bold text-t1">
                {pendingInvites.length === 1
                  ? "1 richiesta di collaborazione"
                  : `${pendingInvites.length} richieste di collaborazione`}
              </Text>
              <Text className="text-xs text-t3">Tocca per rispondere</Text>
            </View>
            <Icon name="chevR" size={18} color="#8c857a" />
          </View>
        </Pressable>
      ) : null}

      {/* Il lavoro, non la vetrina: i numeri che il professionista guarda ogni
          giorno sono i suoi turni e le sue ore. Rating e recensioni restano nel
          profilo, dove si va quando si ha qualcosa da mostrare. */}
      <View className="flex-row gap-2.5">
        <StatCard
          value={String(upcomingItems.length)}
          label="in programma"
          onPress={() => router.push("/(waiter)/(tabs)/turni")}
        />
        <StatCard
          value={String(totals.count)}
          label="turni svolti"
          onPress={() => router.push("/(waiter)/storico")}
        />
        <StatCard
          value={formatHours(totals.totalHours)}
          label="ore totali"
          onPress={() => router.push("/(waiter)/storico")}
        />
      </View>

      {daConfermare > 0 ? (
        <Pressable onPress={() => router.push("/(waiter)/(tabs)/turni")}>
          <View className="flex-row items-center gap-3 rounded-3xl border border-border-2 bg-bg-2 p-4">
            <Icon name="alert" size={20} color="#EAB54C" />
            <View className="flex-1">
              <Text className="text-sm font-sans-bold text-t1">
                {daConfermare === 1
                  ? "1 turno da confermare"
                  : `${daConfermare} turni da confermare`}
              </Text>
              <Text className="text-xs text-t3">
                Il locale sta aspettando la tua risposta
              </Text>
            </View>
            <Icon name="chevR" size={18} color="#8c857a" />
          </View>
        </Pressable>
      ) : null}

      <View>
        <SectionHeader
          title="Prossimi turni"
          actionLabel={upcomingItems.length > 0 ? "Vedi tutti" : undefined}
          onAction={() => router.push("/(waiter)/(tabs)/turni")}
        />
        {assignedQuery.isLoading ? (
          <ActivityIndicator color="#EAB54C" className="mt-4" />
        ) : assignedQuery.isError ? (
          <QueryError onRetry={() => assignedQuery.refetch()} />
        ) : upcomingItems.length === 0 ? (
          <EmptyState
            title="Nessun turno in programma"
            subtitle="Quando un locale ti assegna un turno lo trovi qui."
          />
        ) : (
          <View className="gap-3">
            {upcomingItems.map((a) => (
              <MyShiftCard
                key={a.id}
                shift={a.shift!}
                status={a.status}
                role={a.role?.name}
                onPress={() => router.push(`/(waiter)/shift/${a.shift!.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
