import { supabase } from "@/lib/supabase";
import type {
  RatingBreakdown,
  Review,
  ReviewSort,
  WaiterPublicCard,
} from "./types";

export const REVIEWS_PAGE_SIZE = 15;

/**
 * One page of a waiter's reviews (offset pagination). Filtering/sorting is done
 * server-side so we never fetch the whole list. Reviews are public (RLS
 * "reviews: public read"); customers create them from the separate web form.
 */
export async function getWaiterReviewsPage(params: {
  waiterId: string;
  page: number;
  sort: ReviewSort;
  ratingFilter?: number | null;
  tag?: string | null;
}): Promise<Review[]> {
  const { waiterId, page, sort, ratingFilter, tag } = params;

  let q = supabase
    .from("reviews")
    .select("*")
    .eq("waiter_id", waiterId)
    .eq("status", "published");
  if (ratingFilter != null) q = q.eq("rating", ratingFilter);
  if (tag) q = q.contains("tags", [tag]);

  const ordered =
    sort === "top"
      ? q
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false })
      : sort === "low"
        ? q
            .order("rating", { ascending: true })
            .order("created_at", { ascending: false })
        : q.order("created_at", { ascending: false });

  const from = page * REVIEWS_PAGE_SIZE;
  const { data, error } = await ordered.range(
    from,
    from + REVIEWS_PAGE_SIZE - 1
  );
  if (error) throw new Error(error.message);
  return (data as Review[] | null) ?? [];
}

/** A short preview of the newest reviews (profile tab / home), capped by `limit`. */
export async function getWaiterReviewsPreview(
  waiterId: string,
  limit = 3
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("waiter_id", waiterId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as Review[] | null) ?? [];
}

/** Counts of published reviews per star (1..5) for the distribution summary. */
export async function getRatingBreakdown(
  waiterId: string
): Promise<RatingBreakdown> {
  const { data, error } = await supabase.rpc("get_rating_breakdown", {
    p_waiter: waiterId,
  });
  if (error) throw new Error(error.message);
  const out: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of data ?? []) {
    out[row.rating] = Number(row.cnt);
  }
  return out;
}

/**
 * A waiter's public "business card" (safe fields + rating aggregates) from the
 * `waiter_public_cards` view. rating_avg/rating_count are kept in sync by the
 * `reviews_sync_waiter_rating` trigger.
 */
export async function getWaiterPublicCard(
  waiterId: string
): Promise<WaiterPublicCard | null> {
  const { data, error } = await supabase
    .from("waiter_public_cards")
    .select("*")
    .eq("id", waiterId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}
