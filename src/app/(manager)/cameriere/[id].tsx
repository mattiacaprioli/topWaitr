import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { WaiterReviewsList } from "@/features/reviews/WaiterReviewsList";
import { useWaiterPublicCard } from "@/features/reviews/hooks";
import { useWaiterProfile } from "@/features/waiterProfile/hooks";

export default function WaiterProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const card = useWaiterPublicCard(id).data;
  const profile = useWaiterProfile(id).data;
  const wp = profile?.waiter_profile ?? null;

  const name = card?.full_name ?? profile?.full_name ?? "Cameriere";
  const roleCity = [card?.primary_role, card?.city].filter(Boolean).join(" · ");

  const headerTop = (
    <View className="gap-3 rounded-3xl border border-border-2 bg-bg-card p-5">
      <View className="flex-row items-center gap-3">
        <Avatar uri={card?.avatar_url ?? undefined} name={name} size={56} />
        <View className="flex-1">
          <Text className="text-lg font-sans-bold text-t1">{name}</Text>
          {roleCity ? <Text className="text-sm text-t3">{roleCity}</Text> : null}
          <RatingBadge
            avg={card?.rating_avg ?? null}
            count={card?.rating_count ?? null}
            className="mt-1"
          />
        </View>
      </View>
      {profile?.bio ? (
        <Text className="text-sm text-t2">{profile.bio}</Text>
      ) : null}
      {wp?.experience ? (
        <Text className="text-sm text-t3">Esperienza: {wp.experience}</Text>
      ) : null}
      {wp?.specializations ? (
        <Text className="text-sm text-t3">
          Specializzazioni: {wp.specializations}
        </Text>
      ) : null}
      {wp?.languages && wp.languages.length > 0 ? (
        <Text className="text-sm text-t3">Lingue: {wp.languages.join(" · ")}</Text>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5 pb-2">
        <ScreenHeader eyebrow="Candidato" title={name} titleClassName="text-2xl" />
      </View>
      <WaiterReviewsList
        waiterId={id}
        headerTop={headerTop}
        bottomInset={insets.bottom + 24}
      />
    </View>
  );
}
