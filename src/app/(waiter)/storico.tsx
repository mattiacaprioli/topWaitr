import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/lib/auth";
import { formatDate, formatHours, formatTime } from "@/lib/format";
import { useMyWorkHistory } from "@/features/assignments/history";

export default function WaiterHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const waiterId = session!.user.id;
  const history = useMyWorkHistory(waiterId);

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 48,
        gap: 20,
      }}
    >
      <ScreenHeader eyebrow="Il tuo lavoro" title="Le mie ore" />

      {history.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-10" />
      ) : history.isError ? (
        <QueryError onRetry={history.refetch} />
      ) : (
        <>
          <View className="flex-row gap-2.5">
            <StatCard value={String(history.count)} label="turni svolti" />
            <StatCard value={formatHours(history.totalHours)} label="ore totali" />
          </View>

          {history.items.length === 0 ? (
            <EmptyState
              title="Ancora nessun turno svolto"
              subtitle="Qui vedrai lo storico dei tuoi turni e le ore totali."
            />
          ) : (
            <View className="gap-3">
              {history.items.map((i) => (
                <Card key={i.key} className="rounded-3xl border-border-2 p-4">
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      uri={i.logoUrl ?? undefined}
                      name={i.venueName}
                      size={44}
                    />
                    <View className="flex-1">
                      <Text
                        className="text-base font-sans-bold text-t1"
                        numberOfLines={1}
                      >
                        {i.venueName}
                      </Text>
                      <Text className="text-xs text-t3">
                        {formatDate(i.date)} · {formatTime(i.start_time)}–
                        {formatTime(i.end_time)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-sans-bold text-gold">
                        {formatHours(i.hours)}
                      </Text>
                      <Text className="text-[10px] text-t4">
                        {i.kind === "staff" ? "Staff" : "Extra"}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
