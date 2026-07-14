import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { Pill } from "@/components/ui/Pill";
import { QueryError } from "@/components/ui/QueryError";
import { useAuth } from "@/lib/auth";
import { useMyVenue } from "@/features/venues/hooks";
import { useVenueStaff } from "@/features/staff/hooks";
import type { StaffMemberWithWaiter } from "@/features/staff/api";

function StaffRow({
  member,
  onPress,
}: {
  member: StaffMemberWithWaiter;
  onPress: () => void;
}) {
  const linked = !!member.waiter_id;
  const avatarUri = member.waiter?.avatar_url ?? undefined;
  return (
    <Card className="rounded-3xl border-border-2 p-4" onPress={onPress}>
      <View className="flex-row items-center gap-3">
        <Avatar uri={avatarUri} name={member.display_name} size={44} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-sans-bold text-t1">
              {member.display_name}
            </Text>
            {linked ? (
              <Icon name="verified" size={15} color="#EAB54C" />
            ) : null}
          </View>
          {member.role ? (
            <Text className="text-xs text-t3">{member.role}</Text>
          ) : null}
          {member.link_status === "pending" ? (
            <View className="mt-1 flex-row">
              <Pill label="Invito in attesa" variant="pending" />
            </View>
          ) : null}
        </View>
        <Chip
          label={member.employment_type === "fisso" ? "Fisso" : "A chiamata"}
          active
          gold={member.employment_type === "fisso"}
        />
        <Icon name="chevR" size={18} color="#8c857a" />
      </View>
    </Card>
  );
}

export default function ManagerStaffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session!.user.id;

  const venueQuery = useMyVenue(userId);
  const venue = venueQuery.data ?? null;
  const staffQuery = useVenueStaff(venue?.id);
  const staff = staffQuery.data ?? [];

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
          refreshing={staffQuery.isRefetching}
          onRefresh={() => staffQuery.refetch()}
        />
      }
    >
      <View>
        <Mono gold>Organico</Mono>
        <Display className="mt-1 text-4xl">Il mio staff</Display>
      </View>

      {venueQuery.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-16" />
      ) : venueQuery.isError ? (
        <QueryError className="mt-10" onRetry={() => venueQuery.refetch()} />
      ) : !venue ? (
        <View className="mt-6">
          <EmptyState
            title="Configura il tuo locale"
            subtitle="Ti serve un locale prima di creare il tuo organico."
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
            label="Aggiungi allo staff"
            onPress={() => router.push("/(manager)/staff/new")}
          />

          <Card
            className="rounded-3xl border-border-2 p-4"
            onPress={() => router.push("/(manager)/ore")}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-2">
                <Icon name="clock" size={18} color="#EAB54C" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-sans-bold text-t1">
                  Ore del mese
                </Text>
                <Text className="text-xs text-t3">
                  Riepilogo ore e export per il commercialista
                </Text>
              </View>
              <Icon name="chevR" size={18} color="#8c857a" />
            </View>
          </Card>

          {staffQuery.isLoading ? (
            <ActivityIndicator color="#EAB54C" className="mt-6" />
          ) : staffQuery.isError ? (
            <QueryError
              onRetry={() => staffQuery.refetch()}
              subtitle="Non siamo riusciti a caricare l'organico. Riprova."
            />
          ) : staff.length === 0 ? (
            <EmptyState
              title="Nessuno nello staff"
              subtitle="Aggiungi i tuoi camerieri per assegnarli ai turni."
            />
          ) : (
            <View className="gap-3">
              {staff.map((member) => (
                <StaffRow
                  key={member.id}
                  member={member}
                  onPress={() => router.push(`/(manager)/staff/${member.id}`)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
