import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Display } from "@/components/ui/Display";
import { ExperienceTimeline } from "@/components/ui/ExperienceTimeline";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { NoReviews } from "@/components/ui/NoReviews";
import { RatingSummary } from "@/components/ui/RatingSummary";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useExperiences } from "@/features/experiences/hooks";
import {
  useRatingBreakdown,
  useWaiterPublicCard,
  useWaiterReviewsPreview,
} from "@/features/reviews/hooks";
import { useMyWaiterProfile } from "@/features/waiterProfile/hooks";
import { useLeaveVenue, useMyEmployers } from "@/features/staff/hooks";
import { useMyWorkHistory } from "@/features/assignments/history";
import type { MyEmployer } from "@/features/staff/api";
import { useToast } from "@/providers/Toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatHours } from "@/lib/format";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tab = "esperienze" | "recensioni" | "statistiche";
const TABS: { id: Tab; label: string }[] = [
  { id: "esperienze", label: "Esperienze" },
  { id: "recensioni", label: "Recensioni" },
  { id: "statistiche", label: "Statistiche" },
];

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Mono>{label}</Mono>
      <Text className="text-sm text-t2">{value}</Text>
    </View>
  );
}

/** Un locale per cui il cameriere è staff, con azione "Lascia il locale". */
function EmployerCard({ employer }: { employer: MyEmployer }) {
  const toast = useToast();
  const leave = useLeaveVenue();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const venueName = employer.venue?.name ?? "Locale";

  function onConfirm() {
    leave.mutate(employer.id, {
      onSuccess: () => {
        setConfirmVisible(false);
        toast.show("Hai lasciato il locale");
      },
      onError: () => {
        setConfirmVisible(false);
        toast.show("Operazione non riuscita. Riprova.", "error");
      },
    });
  }

  return (
    <Card className="rounded-3xl border-border-2 p-4">
      <View className="flex-row items-center gap-3">
        <Avatar
          uri={employer.venue?.logo_url ?? undefined}
          name={venueName}
          size={40}
        />
        <View className="flex-1">
          <Text className="text-base font-sans-bold text-t1">{venueName}</Text>
          {employer.venue?.city ? (
            <Text className="text-xs text-t3">{employer.venue.city}</Text>
          ) : null}
        </View>
        <Chip
          label={employer.employment_type === "fisso" ? "Fisso" : "A chiamata"}
          active
          gold={employer.employment_type === "fisso"}
        />
      </View>
      <Pressable
        onPress={() => setConfirmVisible(true)}
        hitSlop={6}
        className="mt-3 self-start"
      >
        <Text className="text-sm font-sans-semibold text-error">
          Lascia il locale
        </Text>
      </Pressable>

      <ConfirmModal
        visible={confirmVisible}
        title="Lasciare questo locale?"
        message={`Non farai più parte dello staff di ${venueName}.`}
        confirmLabel="Lascia"
        destructive
        pending={leave.isPending}
        onConfirm={onConfirm}
        onCancel={() => setConfirmVisible(false)}
      />
    </Card>
  );
}

export default function WaiterProfiloScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const name = profile?.full_name ?? "Cameriere";
  const userId = session!.user.id;
  const [tab, setTab] = useState<Tab>("esperienze");

  const profileQuery = useMyWaiterProfile(userId);
  const data = profileQuery.data;
  const wp = data?.waiter_profile ?? null;
  const role = wp?.primary_role ?? null;
  const city = data?.city ?? null;
  const bio = data?.bio ?? null;
  const languages = wp?.languages ?? [];
  const specializations = wp?.specializations ?? null;
  const hasProfileInfo = !!bio || languages.length > 0 || !!specializations;

  const experiences = useExperiences(userId).data ?? [];

  const card = useWaiterPublicCard(userId).data;
  const reviews = useWaiterReviewsPreview(userId, 3).data ?? [];
  const breakdown = useRatingBreakdown(userId).data;
  const employers = useMyEmployers(userId).data ?? [];
  const history = useMyWorkHistory(userId);
  const reviewsCount = card?.rating_count ?? 0;
  const ratingLabel =
    reviewsCount > 0
      ? (card?.rating_avg ?? 0).toFixed(1).replace(".", ",")
      : "—";
  const subtitle = [role, city].filter(Boolean).join(" · ");

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
      {/* Barra: occhiello + impostazioni */}
      <View className="flex-row items-center justify-between">
        <Mono>Profilo · Pubblico</Mono>
        <Pressable
          onPress={() => router.push("/(waiter)/impostazioni")}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-border-2 bg-bg-2"
        >
          <Icon name="settings" size={19} color="#F8F4ED" />
        </Pressable>
      </View>

      {/* Identità */}
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
          <Avatar name={name} size={104} />
        </View>

        <View className="items-center gap-1.5">
          <View className="flex-row items-center gap-2">
            <Display className="text-4xl">{name}</Display>
            <Icon name="verified" size={22} color="#EAB54C" />
          </View>
          {subtitle ? (
            <Text className="text-sm text-t2">{subtitle}</Text>
          ) : null}

          {reviewsCount > 0 ? (
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <Icon name="star" size={14} color="#EAB54C" />
              <Text className="text-base font-sans-bold text-t1">
                {ratingLabel}
              </Text>
              <Text className="text-sm text-t3">
                · {reviewsCount} recensioni verificate
              </Text>
            </View>
          ) : (
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <Icon name="starOutline" size={13} color="#5A5348" />
              <Text className="text-sm text-t3">Ancora nessuna recensione</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2.5">
        <GoldButton
          label="Condividi profilo"
          onPress={() => router.push("/(waiter)/qr")}
          className="flex-1"
        />
        <GhostButton
          label="Modifica"
          onPress={() => router.push("/(waiter)/profilo-edit")}
        />
      </View>

      {/* I tuoi locali (staff fisso/a chiamata) */}
      {employers.length > 0 ? (
        <View className="gap-3">
          <Mono>I tuoi locali</Mono>
          {employers.map((e) => (
            <EmployerCard key={e.id} employer={e} />
          ))}
        </View>
      ) : null}

      {/* Tabs */}
      <View className="flex-row gap-1 rounded-2xl border border-border bg-bg-card p-1">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              className={cn(
                "flex-1 items-center rounded-xl py-2.5",
                active && "bg-bg-2",
              )}
            >
              <Text
                className={cn(
                  "text-sm",
                  active ? "font-sans-semibold text-t1" : "text-t3",
                )}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "esperienze" ? (
        <View className="gap-6">
          <View>
            <SectionHeader
              title="Esperienze"
              actionLabel="Aggiungi"
              onAction={() => router.push("/(waiter)/esperienza/new")}
            />
            {experiences.length > 0 ? (
              <ExperienceTimeline
                items={experiences}
                onPressItem={(id) =>
                  router.push(`/(waiter)/esperienza/${id}`)
                }
              />
            ) : (
              <View className="gap-3 rounded-3xl border border-border-2 bg-bg-card p-5">
                <Text className="text-sm leading-5 text-t3">
                  Aggiungi i tuoi lavori passati per farti notare dai
                  ristoratori.
                </Text>
                <GoldButton
                  label="Aggiungi esperienza"
                  onPress={() => router.push("/(waiter)/esperienza/new")}
                />
              </View>
            )}
          </View>

          {hasProfileInfo ? (
            <View className="gap-4 rounded-3xl border border-border-2 bg-bg-card p-5">
              <Mono>Il tuo profilo</Mono>
              {bio ? (
                <Text className="text-sm leading-5 text-t2">{bio}</Text>
              ) : null}
              {languages.length > 0 ? (
                <InfoLine label="Lingue" value={languages.join(" · ")} />
              ) : null}
              {specializations ? (
                <InfoLine label="Specializzazioni" value={specializations} />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {tab === "recensioni" ? (
        <View className="gap-3">
          {reviewsCount > 0 ? (
            <>
              <RatingSummary
                avg={card?.rating_avg ?? null}
                count={card?.rating_count ?? null}
                breakdown={breakdown}
              />
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
              <GhostButton
                label={`Vedi tutte le ${reviewsCount} recensioni`}
                onPress={() => router.push("/(waiter)/recensioni")}
              />
            </>
          ) : (
            <NoReviews onOpenQR={() => router.push("/(waiter)/qr")} />
          )}
        </View>
      ) : null}

      {tab === "statistiche" ? (
        <View className="gap-3">
          <View className="flex-row gap-2.5">
            <StatCard value={ratingLabel} label="★ media voto" />
            <StatCard value={String(reviewsCount)} label="recensioni" />
          </View>
          <View className="flex-row gap-2.5">
            <StatCard value={String(history.count)} label="turni svolti" />
            <StatCard value={formatHours(history.totalHours)} label="ore totali" />
          </View>
          <GhostButton
            label="Vedi storico turni"
            onPress={() => router.push("/(waiter)/storico")}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
