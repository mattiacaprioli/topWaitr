import { type ReactNode, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { Pressable, Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { RatingSummary } from "@/components/ui/RatingSummary";
import { ReviewCard } from "@/components/ui/ReviewCard";
import {
  useRatingBreakdown,
  useWaiterPublicCard,
  useWaiterReviewsInfinite,
} from "./hooks";
import type { ReviewSort } from "./types";

const SORTS: { id: ReviewSort; label: string }[] = [
  { id: "recent", label: "Recenti" },
  { id: "top", label: "Voto alto" },
  { id: "low", label: "Voto basso" },
];
const STAR_FILTERS = [null, 5, 4, 3, 2, 1] as const;
const MERIT_TAGS = [
  "GENTILE",
  "VELOCE",
  "CORTESE",
  "VINO",
  "MULTILINGUE",
  "ATTENZIONE",
];

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-full px-3.5 py-2",
        active ? "bg-gold" : "border border-border-2"
      )}
    >
      <Text
        className={cn(
          "text-xs font-sans-semibold uppercase",
          active ? "text-gold-ink" : "text-t3"
        )}
        style={{ letterSpacing: 0.6 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type Props = {
  waiterId: string;
  /** Contenuto reso sopra il riepilogo (es. la card profilo lato ristoratore). */
  headerTop?: ReactNode;
  bottomInset?: number;
};

/**
 * Lista recensioni di un cameriere (riepilogo + filtri + infinite scroll).
 * Condivisa tra la schermata del cameriere e il profilo lato ristoratore.
 */
export function WaiterReviewsList({
  waiterId,
  headerTop,
  bottomInset = 24,
}: Props) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const card = useWaiterPublicCard(waiterId).data;
  const breakdown = useRatingBreakdown(waiterId).data;
  const query = useWaiterReviewsInfinite(waiterId, { sort, ratingFilter, tag });
  const reviews = query.data?.pages.flat() ?? [];

  const header = (
    <View className="gap-4 px-5 pb-4">
      {headerTop}
      <RatingSummary
        avg={card?.rating_avg ?? null}
        count={card?.rating_count ?? null}
        breakdown={breakdown}
      />
      <View className="gap-2">
        <View className="flex-row flex-wrap gap-2">
          {SORTS.map((s) => (
            <FilterChip
              key={s.id}
              label={s.label}
              active={sort === s.id}
              onPress={() => setSort(s.id)}
            />
          ))}
        </View>
        <View className="flex-row flex-wrap gap-2">
          {STAR_FILTERS.map((s) => (
            <FilterChip
              key={String(s)}
              label={s == null ? "Tutte" : `${s}★`}
              active={ratingFilter === s}
              onPress={() => setRatingFilter(s)}
            />
          ))}
        </View>
        <View className="flex-row flex-wrap gap-2">
          <FilterChip
            label="Tutti i tag"
            active={tag === null}
            onPress={() => setTag(null)}
          />
          {MERIT_TAGS.map((t) => (
            <FilterChip
              key={t}
              label={t}
              active={tag === t}
              onPress={() => setTag(t)}
            />
          ))}
        </View>
      </View>
    </View>
  );

  if (query.isError) {
    return (
      <View className="flex-1 justify-center px-6">
        <QueryError onRetry={() => query.refetch()} />
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <ReviewCard review={item} className="mx-5" />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomInset }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        query.isLoading ? (
          <ActivityIndicator color="#EAB54C" style={{ marginTop: 40 }} />
        ) : (
          <EmptyState
            title="Nessuna recensione"
            subtitle="Non ci sono recensioni per questo filtro."
          />
        )
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <ActivityIndicator color="#EAB54C" style={{ marginVertical: 24 }} />
        ) : null
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      }}
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => query.refetch()}
        />
      }
    />
  );
}
