import type { Tables } from "@/types/database";

export type Review = Tables<"reviews">;

/** Public, safe projection of a waiter (from the `waiter_public_cards` view). */
export type WaiterPublicCard = Tables<"waiter_public_cards">;

/** Sort order for the reviews list. */
export type ReviewSort = "recent" | "top" | "low";

/** Count of reviews per star (1..5). */
export type RatingBreakdown = Record<number, number>;
