import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { getWaiterPublicCard, getWaiterReviews } from "./api";

/** A waiter's collected reviews (profile "Recensioni" section). */
export function useWaiterReviews(waiterId: string | undefined) {
  return useQuery({
    queryKey: qk.reviews.forWaiter(waiterId ?? ""),
    queryFn: () => getWaiterReviews(waiterId as string),
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
