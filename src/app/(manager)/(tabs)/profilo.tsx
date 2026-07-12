import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { Mono } from "@/components/ui/Mono";
import { QueryError } from "@/components/ui/QueryError";
import { useAuth } from "@/lib/auth";
import { useMyVenue } from "@/features/venues/hooks";

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Mono>{label}</Mono>
      <Text className="text-sm text-t2">{value}</Text>
    </View>
  );
}

export default function ManagerProfiloScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuth();
  const userId = session!.user.id;
  const name = profile?.full_name ?? "Ristoratore";

  const venueQuery = useMyVenue(userId);
  const venue = venueQuery.data ?? null;

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 96,
        gap: 24,
      }}
    >
      <Mono>Profilo · Locale</Mono>

      {venueQuery.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-16" />
      ) : venueQuery.isError ? (
        <QueryError className="mt-10" onRetry={() => venueQuery.refetch()} />
      ) : !venue ? (
        <View className="mt-4">
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
        <>
          {/* Identità locale */}
          <View className="items-center gap-4">
            <View
              className="rounded-full"
              style={{
                borderWidth: 2.5,
                borderColor: "#EAB54C",
                padding: 5,
                shadowColor: "#EAB54C",
                shadowOpacity: 0.2,
                shadowRadius: 26,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Avatar uri={venue.logo_url ?? undefined} name={venue.name} size={104} />
            </View>
            <View className="items-center gap-1.5">
              <Display className="text-4xl">{venue.name}</Display>
              {venue.city ? (
                <Text className="text-sm text-t2">{venue.city}</Text>
              ) : null}
            </View>
          </View>

          <GoldButton
            label="Modifica locale"
            onPress={() => router.push("/(manager)/venue")}
          />

          {venue.cuisine_type || venue.address || venue.description ? (
            <View className="gap-4 rounded-3xl border border-border-2 bg-bg-card p-5">
              <Mono>Il tuo locale</Mono>
              {venue.cuisine_type ? (
                <InfoLine label="Cucina" value={venue.cuisine_type} />
              ) : null}
              {venue.address ? (
                <InfoLine label="Indirizzo" value={venue.address} />
              ) : null}
              {venue.description ? (
                <Text className="text-sm leading-5 text-t2">
                  {venue.description}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <View className="mt-auto">
        <Mono className="mb-2">Account</Mono>
        <Text className="mb-3 text-sm text-t3">{name}</Text>
        <GhostButton label="Esci" onPress={signOut} />
      </View>
    </ScrollView>
  );
}
