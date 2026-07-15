import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GhostButton } from "@/components/ui/GhostButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { NoReviews } from "@/components/ui/NoReviews";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { QueryError } from "@/components/ui/QueryError";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { StatCard } from "@/components/ui/StatCard";
import {
  useMyApplications,
  useMyApplicationsList,
  useMyUpcomingShifts,
} from "@/features/applications/hooks";
import { useMyAssignedUpcoming } from "@/features/assignments/hooks";
import { useMyPendingInvites } from "@/features/staff/hooks";
import { Pill } from "@/components/ui/Pill";
import type { ShiftWithVenue } from "@/features/shifts/types";
import type { Enums } from "@/types/database";
import { reviewUrlFor } from "@/features/reviews/config";
import {
  useWaiterPublicCard,
  useWaiterReviewsPreview,
} from "@/features/reviews/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { useAuth } from "@/lib/auth";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { formatDate, formatEuro, formatTime, shiftTotal } from "@/lib/format";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { ActivityIndicator, Linking, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UpcomingItem = {
  key: string;
  shift: ShiftWithVenue;
  assigned: boolean;
  status?: Enums<"assignment_status">;
};

export default function WaiterHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const waiterId = session!.user.id;

  const upcomingQuery = useMyUpcomingShifts(waiterId);
  const assignedQuery = useMyAssignedUpcoming(waiterId);
  const pendingInvites = useMyPendingInvites(waiterId).data ?? [];
  const appsQuery = useMyApplications(waiterId);
  const appsListQuery = useMyApplicationsList(waiterId);
  const card = useWaiterPublicCard(waiterId).data;
  const reviews = useWaiterReviewsPreview(waiterId, 1).data ?? [];
  const unread = useUnreadCount(waiterId).data ?? 0;
  const pull = usePullToRefresh(() =>
    Promise.all([
      upcomingQuery.refetch(),
      assignedQuery.refetch(),
      appsQuery.refetch(),
      appsListQuery.refetch(),
    ])
  );

  const upcoming = upcomingQuery.data ?? [];
  const assigned = assignedQuery.data ?? [];
  const upcomingItems: UpcomingItem[] = [
    ...assigned
      .filter((a) => a.shift != null)
      .map((a) => ({
        key: `asg-${a.id}`,
        shift: a.shift!,
        assigned: true,
        status: a.status,
      })),
    ...upcoming
      .filter((a) => a.shift != null)
      .map((a) => ({ key: `app-${a.id}`, shift: a.shift!, assigned: false })),
  ].sort((a, b) => a.shift.date.localeCompare(b.shift.date));
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Cameriere";

  // Reputazione (dati reali). "Servizi" = candidature accettate ormai passate.
  const today = new Date().toISOString().slice(0, 10);
  const serviziCount = (appsListQuery.data ?? []).filter(
    (a) => a.status === "accepted" && a.shift != null && a.shift.date < today,
  ).length;
  const reviewsCount = card?.rating_count ?? 0;
  const ratingLabel =
    reviewsCount > 0
      ? (card?.rating_avg ?? 0).toFixed(1).replace(".", ",")
      : "—";
  const featured = reviews[0] ?? null;

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

      {/* Reputazione */}
      <View className="flex-row gap-2.5">
        <StatCard value={ratingLabel} label="★ rating" />
        <StatCard value={String(serviziCount)} label="servizi" />
        <StatCard value={String(reviewsCount)} label="recensioni" />
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Mono>Recensioni</Mono>
            <Display className="mt-0.5 text-2xl">Cosa dicono di te</Display>
          </View>
          <GhostButton
            label="Anteprima"
            onPress={() => Linking.openURL(reviewUrlFor(waiterId))}
          />
        </View>
        {featured ? (
          <Pressable onPress={() => router.push("/(waiter)/recensioni")}>
            <ReviewCard review={featured} />
          </Pressable>
        ) : (
          <NoReviews onOpenQR={() => router.push("/(waiter)/qr")} />
        )}
      </View>

      <View>
        <Mono className="mb-3">Prossimi turni</Mono>
        {upcomingQuery.isLoading ? (
          <ActivityIndicator color="#EAB54C" className="mt-4" />
        ) : upcomingQuery.isError ? (
          <QueryError onRetry={() => upcomingQuery.refetch()} />
        ) : upcomingItems.length === 0 ? (
          <EmptyState
            title="Nessun turno in programma"
            subtitle="I turni assegnati e le candidature accettate compariranno qui."
          />
        ) : (
          <View className="gap-3">
            {upcomingItems.map((item) => {
              const s = item.shift;
              const total = item.assigned
                ? null
                : shiftTotal(s.hourly_rate, s.start_time, s.end_time);
              return (
                <Card
                  key={item.key}
                  className="rounded-3xl border-border-2 p-5"
                  onPress={() => router.push(`/(waiter)/shift/${s.id}`)}
                >
                  <View className="flex-row items-start gap-3">
                    <Avatar
                      uri={s.venue?.logo_url}
                      name={s.venue?.name ?? "Locale"}
                      size={44}
                    />
                    <View className="flex-1">
                      <Text
                        className="text-base font-sans-bold text-t1"
                        numberOfLines={1}
                      >
                        {s.venue?.name ?? "Locale"}
                      </Text>
                      <Text
                        className="mt-0.5 text-sm text-t3"
                        numberOfLines={1}
                      >
                        {s.title}
                      </Text>
                    </View>
                    {item.assigned ? (
                      item.status === "confirmed" ? (
                        <Pill label="Staff" variant="tag" />
                      ) : (
                        <Pill label="Da confermare" variant="pending" />
                      )
                    ) : total != null ? (
                      <Text className="text-lg font-sans-bold text-gold">
                        {formatEuro(total)}
                      </Text>
                    ) : null}
                  </View>
                  <View className="mt-3 flex-row items-center gap-2">
                    <Icon name="calendar" size={15} color="#8c857a" />
                    <Text className="text-sm text-t2">
                      {formatDate(s.date)} · {formatTime(s.start_time)}–
                      {formatTime(s.end_time)}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
