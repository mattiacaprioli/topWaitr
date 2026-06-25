import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { ScrollView, Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { Pill } from "@/components/ui/Pill";
import { formatDate, formatRate, formatTime } from "@/lib/format";
import { useOpenShifts } from "@/features/shifts/hooks";

export default function WaiterHome() {
  const router = useRouter();
  const shiftsQuery = useOpenShifts();
  const shifts = shiftsQuery.data ?? [];

  if (shiftsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-1">
        <ActivityIndicator color="#EAB54C" />
      </View>
    );
  }

  if (shiftsQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-bg-1 px-6">
        <QueryError onRetry={() => shiftsQuery.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-1"
      contentContainerClassName="p-6 gap-3"
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={shiftsQuery.isRefetching}
          onRefresh={() => shiftsQuery.refetch()}
        />
      }
    >
      {shifts.length === 0 ? (
        <View className="mt-10">
          <EmptyState
            title="Nessun turno disponibile"
            subtitle="Al momento non ci sono turni aperti. Torna più tardi."
          />
        </View>
      ) : (
        shifts.map((shift) => {
          const remaining = Math.max(
            0,
            shift.positions_total - shift.positions_filled
          );
          return (
            <Card
              key={shift.id}
              onPress={() => router.push(`/(waiter)/shift/${shift.id}`)}
            >
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 text-base font-sans-bold text-t1">
                  {shift.title}
                </Text>
                <Pill
                  label={remaining > 0 ? `${remaining} posti` : "Al completo"}
                  variant={remaining > 0 ? "open" : "neutral"}
                />
              </View>
              {shift.venue ? (
                <Text className="mt-1 text-sm text-t2">
                  {shift.venue.name}
                  {shift.venue.city ? ` · ${shift.venue.city}` : ""}
                </Text>
              ) : null}
              <Text className="mt-1 text-sm text-t2">
                {formatDate(shift.date)} · {formatTime(shift.start_time)}–
                {formatTime(shift.end_time)}
              </Text>
              <Text className="mt-1 text-sm text-t3">
                {formatRate(shift.hourly_rate)}
              </Text>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}
