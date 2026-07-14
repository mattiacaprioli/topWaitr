import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { QueryError } from "@/components/ui/QueryError";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ManagerShiftCard } from "@/features/shifts/ManagerShiftCard";
import { useAuth } from "@/lib/auth";
import { useMyVenue } from "@/features/venues/hooks";
import { useMyShifts } from "@/features/shifts/hooks";

export default function ManagerShiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session!.user.id;

  const venueQuery = useMyVenue(userId);
  const venue = venueQuery.data ?? null;
  const shiftsQuery = useMyShifts(venue?.id);
  const shifts = shiftsQuery.data ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = shifts.filter((s) => s.date >= today);
  const past = shifts.filter((s) => s.date < today).reverse();

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
        <Mono gold>Il tuo locale</Mono>
        <Display className="mt-1 text-4xl">I tuoi turni</Display>
      </View>

      {venueQuery.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-16" />
      ) : venueQuery.isError ? (
        <QueryError className="mt-10" onRetry={() => venueQuery.refetch()} />
      ) : !venue ? (
        <View className="mt-6">
          <EmptyState
            title="Configura il tuo locale"
            subtitle="Ti serve un locale prima di pubblicare turni."
          />
          <GoldButton
            className="mt-2"
            label="Configura locale"
            onPress={() => router.push("/(manager)/venue")}
          />
        </View>
      ) : (
        <>
          <GoldButton
            label="Pubblica turno"
            onPress={() => router.push("/(manager)/shift/new")}
          />

          <Card
            className="rounded-3xl border-border-2 p-4"
            onPress={() => router.push("/(manager)/copertura")}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-2">
                <Icon name="users" size={18} color="#EAB54C" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-sans-bold text-t1">
                  Copertura turni
                </Text>
                <Text className="text-xs text-t3">
                  Fabbisogno per ruolo e turni scoperti
                </Text>
              </View>
              <Icon name="chevR" size={18} color="#8c857a" />
            </View>
          </Card>

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
              subtitle="Tocca «Pubblica turno» per creare il tuo primo turno."
            />
          ) : (
            <>
              <SectionHeader title="In programma" />
              {upcoming.length === 0 ? (
                <EmptyState
                  title="Nessun turno in programma"
                  subtitle="I turni futuri compariranno qui."
                />
              ) : (
                <View className="gap-3">
                  {upcoming.map((shift) => (
                    <ManagerShiftCard
                      key={shift.id}
                      shift={shift}
                      onPress={() => router.push(`/(manager)/shift/${shift.id}`)}
                    />
                  ))}
                </View>
              )}

              {past.length > 0 ? (
                <View className="mt-4 gap-3">
                  <SectionHeader title="Storico" />
                  <View className="gap-3">
                    {past.map((shift) => (
                      <ManagerShiftCard
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
        </>
      )}
    </ScrollView>
  );
}
