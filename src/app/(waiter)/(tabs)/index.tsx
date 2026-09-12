import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GhostButton } from "@/components/ui/GhostButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { NoReviews } from "@/components/ui/NoReviews";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { QueryError } from "@/components/ui/QueryError";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useMyAssignedUpcoming } from "@/features/assignments/hooks";
import { useMyWorkHistoryTotals } from "@/features/assignments/history";
import { MyShiftCard } from "@/features/assignments/MyShiftCard";
import { useMyPendingInvites } from "@/features/staff/hooks";
import { reviewUrlFor } from "@/features/reviews/config";
import {
  useWaiterPublicCard,
  useWaiterReviewsPreview,
} from "@/features/reviews/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { useAuth } from "@/lib/auth";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { ActivityIndicator, Linking, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WaiterHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const waiterId = session!.user.id;

  const assignedQuery = useMyAssignedUpcoming(waiterId);
  const pendingInvites = useMyPendingInvites(waiterId).data ?? [];
  const totals = useMyWorkHistoryTotals(waiterId);
  const card = useWaiterPublicCard(waiterId).data;
  const reviews = useWaiterReviewsPreview(waiterId, 1).data ?? [];
  const unread = useUnreadCount(waiterId).data ?? 0;
  const pull = usePullToRefresh(() =>
    Promise.all([assignedQuery.refetch(), totals.refetch()])
  );

  const upcomingItems = (assignedQuery.data ?? []).filter(
    (a) => a.shift != null
  );
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Cameriere";

  // Reputazione (dati reali). "Servizi" = turni già lavorati, lo stesso totale
  // che si legge in "Le mie ore": prima qui se ne contava un sottoinsieme e i
  // due numeri non combaciavano.
  const serviziCount = totals.count;
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
                onPress={() => router.push(`/(waiter)/shift/${a.shift!.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
