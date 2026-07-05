import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Display } from "@/components/ui/Display";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { Pill } from "@/components/ui/Pill";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { useAuth } from "@/lib/auth";
import { useMyWaiterProfile } from "@/features/waiterProfile/hooks";
import { useWaiterPublicCard, useWaiterReviews } from "@/features/reviews/hooks";

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Mono>{label}</Mono>
      <Text className="text-sm text-t2">{value}</Text>
    </View>
  );
}

export default function WaiterProfiloScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuth();
  const name = profile?.full_name ?? "Cameriere";
  const userId = session!.user.id;

  const profileQuery = useMyWaiterProfile(userId);
  const data = profileQuery.data;
  const wp = data?.waiter_profile ?? null;
  const role = wp?.primary_role ?? null;
  const city = data?.city ?? null;
  const bio = data?.bio ?? null;
  const experience = wp?.experience ?? null;
  const languages = wp?.languages ?? [];
  const specializations = wp?.specializations ?? null;
  const hasAny =
    !!bio || !!experience || languages.length > 0 || !!specializations || !!city || !!role;

  const card = useWaiterPublicCard(userId).data;
  const reviews = useWaiterReviews(userId).data ?? [];

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
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Mono gold>Profilo</Mono>
          <Display className="mt-1 text-4xl">{name}</Display>
        </View>
        <Pressable
          onPress={() => router.push("/(waiter)/profilo-edit")}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-border-2 bg-bg-2"
        >
          <Icon name="pencil" size={18} color="#F8F4ED" />
        </Pressable>
      </View>

      <View className="items-center gap-3 rounded-3xl border border-border-2 bg-bg-card p-6">
        <Avatar name={name} size={72} />
        <Pill label={role ?? "Cameriere"} variant="tag" />
        <RatingBadge avg={card?.rating_avg ?? null} count={card?.rating_count ?? null} />
        {city ? <Text className="text-sm text-t3">{city}</Text> : null}
        {session?.user.email ? (
          <Text className="text-sm text-t3">{session.user.email}</Text>
        ) : null}
      </View>

      <GoldButton
        label="Mostra il mio QR ai clienti"
        onPress={() => router.push("/(waiter)/qr")}
      />

      <View className="gap-4 rounded-3xl border border-border-2 bg-bg-card p-5">
        <Mono>Il tuo profilo</Mono>
        {hasAny ? (
          <>
            {bio ? (
              <Text className="text-sm leading-5 text-t2">{bio}</Text>
            ) : null}
            {experience ? (
              <InfoLine label="Esperienza" value={experience} />
            ) : null}
            {languages.length > 0 ? (
              <InfoLine label="Lingue" value={languages.join(" · ")} />
            ) : null}
            {specializations ? (
              <InfoLine label="Specializzazioni" value={specializations} />
            ) : null}
          </>
        ) : (
          <Text className="text-sm text-t3">
            Completa il tuo profilo per farti notare dai ristoratori.
          </Text>
        )}
      </View>

      <View className="gap-3">
        <Mono>Recensioni dei clienti</Mono>
        {reviews.length > 0 ? (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        ) : (
          <View className="rounded-3xl border border-border-2 bg-bg-card p-5">
            <Text className="text-sm leading-5 text-t3">
              Nessuna recensione ancora. Mostra il tuo QR ai clienti a fine
              servizio: la tua reputazione ti seguirà, locale dopo locale.
            </Text>
          </View>
        )}
      </View>

      <GhostButton label="Esci" onPress={signOut} />
    </ScrollView>
  );
}
