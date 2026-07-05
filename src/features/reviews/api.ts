import { supabase } from "@/lib/supabase";
import type { Review, WaiterPublicCard } from "./types";

/**
 * The reviews a waiter has collected from customers, newest first. Reviews are
 * public (RLS "reviews: public read"); the app only reads them. Customers create
 * them from the separate public web form via the anon key.
 */
export async function getWaiterReviews(waiterId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("waiter_id", waiterId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
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
