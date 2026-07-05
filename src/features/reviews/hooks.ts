import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import type { ReviewSort } from "./types";
import {
  REVIEWS_PAGE_SIZE,
  getRatingBreakdown,
  getWaiterPublicCard,
  getWaiterReviewsPage,
  getWaiterReviewsPreview,
} from "./api";

/** Short preview of the newest reviews (profile tab / home). */
export function useWaiterReviewsPreview(
  waiterId: string | undefined,
  limit = 3
) {
  return useQuery({
    queryKey: qk.reviews.preview(waiterId ?? "", limit),
    queryFn: () => getWaiterReviewsPreview(waiterId as string, limit),
    enabled: !!waiterId,
  });
}

/** Star distribution (counts per rating) for the summary bars. */
export function useRatingBreakdown(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.reviews.breakdown(waiterId ?? ""),
    queryFn: () => getRatingBreakdown(waiterId as string),
    enabled: !!waiterId,
  });
}

/** Paginated (infinite) reviews list with server-side filter/sort. */
export function useWaiterReviewsInfinite(
  waiterId: string | undefined,
  opts: { sort: ReviewSort; ratingFilter: number | null; tag: string | null }
) {
  return useInfiniteQuery({
    queryKey: qk.reviews.page(
      waiterId ?? "",
      opts.sort,
      opts.ratingFilter,
      opts.tag
    ),
    queryFn: ({ pageParam }) =>
      getWaiterReviewsPage({
        waiterId: waiterId as string,
        page: pageParam,
        sort: opts.sort,
        ratingFilter: opts.ratingFilter,
        tag: opts.tag,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < REVIEWS_PAGE_SIZE ? undefined : allPages.length,
    enabled: !!waiterId,
  });
}

/** A waiter's public card + rating aggregates (reputation badge). */
export function useWaiterPublicCard(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.waiterCard(waiterId ?? ""),
    queryFn: () => getWaiterPublicCard(waiterId as string),
    enabled: !!waiterId,
  });
}
