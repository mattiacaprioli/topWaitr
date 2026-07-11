import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { GoldButton } from "@/components/ui/GoldButton";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useAuth } from "@/lib/auth";
import { formatDate, formatRate, formatTime } from "@/lib/format";
import { useMyVenue } from "@/features/venues/hooks";
import { useMyShifts } from "@/features/shifts/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import type { ShiftWithCount } from "@/features/shifts/types";
import type { Enums } from "@/types/database";

const STATUS_LABEL: Record<Enums<"shift_status">, string> = {
  open: "Aperto",
  closed: "Chiuso",
  cancelled: "Annullato",
};

function ShiftCard({
  shift,
  onPress,
}: {
  shift: ShiftWithCount;
  onPress: () => void;
}) {
  const count = shift.applications[0]?.count ?? 0;
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 text-base font-sans-bold text-t1">
          {shift.title}
        </Text>
        <Pill label={STATUS_LABEL[shift.status]} variant={shift.status} />
      </View>
      <Text className="mt-1 text-sm text-t2">
        {formatDate(shift.date)} · {formatTime(shift.start_time)}–
        {formatTime(shift.end_time)}
      </Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-sm text-t3">{formatRate(shift.hourly_rate)}</Text>
        <Text className="text-sm font-sans-semibold text-gold">
          {count} candidatur{count === 1 ? "a" : "e"}
        </Text>
      </View>
    </Card>
  );
}

export default function ManagerHome() {
  const { profile, session, signOut } = useAuth();
  const router = useRouter();
  const userId = session!.user.id;
  const unread = useUnreadCount(userId).data ?? 0;

  const venueQuery = useMyVenue(userId);
  const venue = venueQuery.data ?? null;
  const shiftsQuery = useMyShifts(venue?.id);
  const shifts = shiftsQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcomingShifts = shifts.filter((s) => s.date >= today);
  const pastShifts = shifts.filter((s) => s.date < today).reverse();

  const loading = venueQuery.isLoading;
  const refreshing = venueQuery.isRefetching || shiftsQuery.isRefetching;
  const onRefresh = () => {
    venueQuery.refetch();
    shiftsQuery.refetch();
  };

  return (
    <ScrollView
      className="flex-1 bg-bg-1"
      contentContainerClassName="p-6"
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View className="flex-row items-center gap-3">
        <Avatar name={profile?.full_name ?? "Ristoratore"} size={56} />
        <View className="flex-1">
          <Text className="text-lg font-sans-bold text-t1">
            {profile?.full_name ?? "Ristoratore"}
          </Text>
          <Pill label="Ristoratore" variant="open" />
        </View>
        <NotificationBell
          count={unread}
          onPress={() => router.push("/(manager)/notifiche")}
        />
        <Pressable onPress={signOut} hitSlop={8}>
          <Text className="text-sm font-sans-semibold text-t3">Esci</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#EAB54C" className="mt-16" />
      ) : venueQuery.isError ? (
        <QueryError className="mt-10" onRetry={() => venueQuery.refetch()} />
      ) : !venue ? (
        <View className="mt-10">
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
      ) : (
        <View className="mt-8">
          <Card className="mb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-sans-bold text-t1">{venue.name}</Text>
              {venue.city ? (
                <Text className="text-sm text-t3">{venue.city}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => router.push("/(manager)/venue")}
              hitSlop={8}
            >
              <Text className="text-sm font-sans-semibold text-gold">Modifica</Text>
            </Pressable>
          </Card>

          <SectionHeader
            title="I tuoi turni"
            actionLabel="Pubblica"
            onAction={() => router.push("/(manager)/shift/new")}
          />

          {shiftsQuery.isLoading ? (
            <ActivityIndicator color="#EAB54C" className="mt-6" />
          ) : shiftsQuery.isError ? (
            <QueryError
              onRetry={() => shiftsQuery.refetch()}
              subtitle="Non siamo riusciti a caricare i turni. Riprova."
            />
          ) : shifts.length === 0 ? (
            <EmptyState
              title="Nessun turno pubblicato"
              subtitle="Tocca «Pubblica» per creare il tuo primo turno."
            />
          ) : (
            <>
              {upcomingShifts.length === 0 ? (
                <EmptyState
                  title="Nessun turno in programma"
                  subtitle="I turni futuri compariranno qui."
                />
              ) : (
                <View className="gap-3">
                  {upcomingShifts.map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      onPress={() => router.push(`/(manager)/shift/${shift.id}`)}
                    />
                  ))}
                </View>
              )}

              {pastShifts.length > 0 ? (
                <View className="mt-8">
                  <SectionHeader title="Storico" />
                  <View className="gap-3">
                    {pastShifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        onPress={() =>
                          router.push(`/(manager)/shift/${shift.id}`)
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}
