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
import { QueryError } from "@/components/ui/QueryError";
import { useAuth } from "@/lib/auth";
import { formatDate, formatEuro, formatTime, shiftTotal } from "@/lib/format";
import { useMyApplications, useMyUpcomingShifts } from "@/features/applications/hooks";

export default function WaiterHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const waiterId = session!.user.id;

  const upcomingQuery = useMyUpcomingShifts(waiterId);
  const appsQuery = useMyApplications(waiterId);

  const upcoming = upcomingQuery.data ?? [];
  const pendingCount = (appsQuery.data ?? []).filter(
    (a) => a.status === "pending"
  ).length;
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Cameriere";

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
          refreshing={upcomingQuery.isRefetching}
          onRefresh={() => {
            upcomingQuery.refetch();
            appsQuery.refetch();
          }}
        />
      }
    >
      <View>
        <Mono gold>La tua area</Mono>
        <Display className="mt-1 text-4xl">Ciao, {firstName}</Display>
      </View>

      <GoldButton label="Trova turni" onPress={() => router.navigate("/turni")} />

      <Pressable
        className="flex-row items-center justify-between rounded-2xl border border-border bg-bg-card px-5 py-4"
        onPress={() => router.push("/(waiter)/candidature")}
      >
        <Text className="text-sm text-t2">Candidature in attesa</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-sans-bold text-gold">
            {pendingCount}
          </Text>
          <Icon name="chevR" size={16} color="#8c857a" />
        </View>
      </Pressable>

      <View>
        <Mono className="mb-3">Prossimi turni</Mono>
        {upcomingQuery.isLoading ? (
          <ActivityIndicator color="#EAB54C" className="mt-4" />
        ) : upcomingQuery.isError ? (
          <QueryError onRetry={() => upcomingQuery.refetch()} />
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="Nessun turno in programma"
            subtitle="Le candidature accettate compariranno qui."
          />
        ) : (
          <View className="gap-3">
            {upcoming.map((app) => {
              const s = app.shift!;
              const total = shiftTotal(s.hourly_rate, s.start_time, s.end_time);
              return (
                <Card
                  key={app.id}
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
                    {total != null ? (
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
