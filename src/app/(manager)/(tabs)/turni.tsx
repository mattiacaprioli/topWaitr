import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl } from "react-native";
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
import { useMyShifts, useVenuePastShifts } from "@/features/shifts/hooks";

export default function ManagerShiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session!.user.id;

  const venueQuery = useMyVenue(userId);
  const venue = venueQuery.data ?? null;
  const upcomingQuery = useMyShifts(venue?.id);
  const upcoming = upcomingQuery.data ?? [];
  const pastQuery = useVenuePastShifts(venue?.id);
  const pastShifts = pastQuery.data?.pages.flat() ?? [];

  const contentStyle = {
    paddingTop: insets.top + 12,
    paddingHorizontal: 20,
    paddingBottom: insets.bottom + 96,
    gap: 16,
  } as const;

  const title = (
    <View>
      <Mono gold>Il tuo locale</Mono>
      <Display className="mt-1 text-4xl">I tuoi turni</Display>
    </View>
  );

  // Gate locale: senza venue non ha senso la lista.
  if (venueQuery.isLoading || venueQuery.isError || !venue) {
    return (
      <ScrollView className="flex-1 bg-bg-0" contentContainerStyle={contentStyle}>
        {title}
        {venueQuery.isLoading ? (
          <ActivityIndicator color="#EAB54C" style={{ marginTop: 64 }} />
        ) : venueQuery.isError ? (
          <QueryError className="mt-10" onRetry={() => venueQuery.refetch()} />
        ) : (
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
        )}
      </ScrollView>
    );
  }

  const openShift = (id: string) => router.push(`/(manager)/shift/${id}`);

  const listHeader = (
    <View style={{ gap: 16 }}>
      {title}

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

      <SectionHeader title="In programma" />
      {upcomingQuery.isLoading ? (
        <ActivityIndicator color="#EAB54C" style={{ marginTop: 8 }} />
      ) : upcomingQuery.isError ? (
        <QueryError
          onRetry={() => upcomingQuery.refetch()}
          subtitle="Non siamo riusciti a caricare i turni. Riprova."
        />
      ) : upcoming.length === 0 ? (
        <EmptyState
          title="Nessun turno in programma"
          subtitle="Tocca «Pubblica turno» per crearne uno."
        />
      ) : (
        <View className="gap-3">
          {upcoming.map((s) => (
            <ManagerShiftCard
              key={s.id}
              shift={s}
              onPress={() => openShift(s.id)}
            />
          ))}
        </View>
      )}

      {pastShifts.length > 0 ? <SectionHeader title="Storico" /> : null}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#0C0907" }}
      contentContainerStyle={contentStyle}
      data={pastShifts}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => (
        <ManagerShiftCard shift={item} onPress={() => openShift(item.id)} />
      )}
      ListHeaderComponent={listHeader}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (pastQuery.hasNextPage && !pastQuery.isFetchingNextPage) {
          pastQuery.fetchNextPage();
        }
      }}
      ListFooterComponent={
        pastQuery.isFetchingNextPage ? (
          <ActivityIndicator color="#EAB54C" style={{ marginTop: 16 }} />
        ) : null
      }
      ListEmptyComponent={
        pastQuery.isLoading ? (
          <ActivityIndicator color="#EAB54C" style={{ marginTop: 8 }} />
        ) : null
      }
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={upcomingQuery.isRefetching || pastQuery.isRefetching}
          onRefresh={() => {
            upcomingQuery.refetch();
            pastQuery.refetch();
          }}
        />
      }
    />
  );
}
