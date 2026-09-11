import { useState } from "react";
import {
  useRatingBreakdown,
  useWaiterPublicCard,
  useWaiterReviewsInfinite,
} from "@/features/reviews/hooks";
import {
  REVIEW_MERIT_TAGS,
  REVIEW_SORTS,
  REVIEW_STAR_FILTERS,
} from "@/features/reviews/filterOptions";
import type { Review, ReviewSort } from "@/features/reviews/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button, Card, Pill, QueryError, Spinner } from "../ui/primitives";

/**
 * Recensioni di un professionista: riepilogo, filtri e lista paginata.
 *
 * Stessi filtri dell'app (`REVIEW_SORTS`/`REVIEW_STAR_FILTERS`/
 * `REVIEW_MERIT_TAGS` condivisi) e stesso hook, quindi la stessa query
 * server-side: quello che cambia è che da scrivania le pagine si chiedono con
 * un bottone invece dello scroll infinito — si legge, si decide, non si scorre.
 */
export function WaiterReviews({ waiterId }: { waiterId: string }) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const card = useWaiterPublicCard(waiterId).data;
  const breakdown = useRatingBreakdown(waiterId).data;
  const query = useWaiterReviewsInfinite(waiterId, { sort, ratingFilter, tag });
  const reviews = query.data?.pages.flat() ?? [];
  const filtered = ratingFilter != null || tag != null;

  if (query.isError) return <QueryError error={query.error} />;

  return (
    <div className="flex flex-col gap-4">
      <RatingSummary
        avg={card?.rating_avg ?? null}
        count={card?.rating_count ?? null}
        breakdown={breakdown}
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {REVIEW_SORTS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              active={sort === s.id}
              onClick={() => setSort(s.id)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REVIEW_STAR_FILTERS.map((s) => (
            <Chip
              key={String(s)}
              label={s == null ? "Tutte" : `${s}★`}
              active={ratingFilter === s}
              onClick={() => setRatingFilter(s)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            label="Tutti i tag"
            active={tag === null}
            onClick={() => setTag(null)}
          />
          {REVIEW_MERIT_TAGS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={tag === t}
              onClick={() => setTag(t)}
            />
          ))}
        </div>
      </div>

      {query.isPending ? <Spinner /> : null}

      {!query.isPending && reviews.length === 0 ? (
        <Card className="p-6 text-center text-sm text-t3">
          {filtered
            ? "Nessuna recensione con questo filtro."
            : "Questo professionista non ha ancora recensioni."}
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </div>

      {query.hasNextPage ? (
        <div>
          <Button
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? "Caricamento…" : "Carica altre"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function RatingSummary({
  avg,
  count,
  breakdown,
}: {
  avg: number | null;
  count: number | null;
  breakdown: Record<number, number> | undefined;
}) {
  const total = count ?? 0;

  if (total === 0) {
    return (
      <Card className="p-4 text-sm text-t3">
        Nessuna recensione: la reputazione si costruisce col QR in sala, non
        c&apos;è
        ancora niente da leggere.
      </Card>
    );
  }

  return (
    <Card className="flex flex-wrap items-center gap-6 p-4">
      <div className="text-center">
        <p className="font-mono text-3xl text-gold">
          {avg != null ? avg.toFixed(1) : "—"}
        </p>
        <Stars value={Math.round(avg ?? 0)} />
        <p className="mt-1 text-xs text-t4">
          {total} recension{total === 1 ? "e" : "i"}
        </p>
      </div>

      <div className="min-w-48 flex-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = breakdown?.[star] ?? 0;
          const pct = total > 0 ? (n / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-6 shrink-0 font-mono text-xs text-t4">
                {star}★
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-2">
                <span
                  className="block h-1.5 rounded-full bg-gold"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right font-mono text-xs text-t4">
                {n}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const who = review.reviewer_name?.trim() || "Anonimo";
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars value={review.rating} />
        <span className="text-xs text-t4">
          {who} · {formatDate(review.created_at.slice(0, 10))}
        </span>
      </div>
      {review.comment ? (
        <p className="text-sm leading-6 text-t2">«{review.comment}»</p>
      ) : null}
      {review.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((t) => (
            <Pill key={t} tone="gold">
              {t}
            </Pill>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="font-mono text-sm text-gold"
      aria-label={`${value} stelle su 5`}
    >
      {"★".repeat(value)}
      <span className="text-t4">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "focus-gold rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition",
        active
          ? "bg-gold text-gold-ink"
          : "border border-border-2 bg-bg-1 text-t3 hover:bg-bg-2"
      )}
    >
      {label}
    </button>
  );
}
