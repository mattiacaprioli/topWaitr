/**
 * Central query-key factory. Always build keys through here so invalidation
 * stays consistent across features.
 */
export const qk = {
  venues: {
    all: ["venues"] as const,
    mine: (ownerId: string) => ["venues", "mine", ownerId] as const,
  },
  profile: {
    mine: (userId: string) => ["profile", "mine", userId] as const,
  },
  shifts: {
    all: ["shifts"] as const,
    open: () => ["shifts", "open"] as const,
    byVenue: (venueId: string) => ["shifts", "byVenue", venueId] as const,
    detail: (id: string) => ["shifts", "detail", id] as const,
  },
  applications: {
    all: ["applications"] as const,
    byShift: (shiftId: string) => ["applications", "byShift", shiftId] as const,
    mine: (shiftId: string, waiterId: string) =>
      ["applications", "mine", shiftId, waiterId] as const,
    mineAll: (waiterId: string) => ["applications", "mineAll", waiterId] as const,
    mineList: (waiterId: string) =>
      ["applications", "mineList", waiterId] as const,
    upcoming: (waiterId: string) =>
      ["applications", "upcoming", waiterId] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    preview: (waiterId: string, limit: number) =>
      ["reviews", "preview", waiterId, limit] as const,
    page: (
      waiterId: string,
      sort: string,
      ratingFilter: number | null,
      tag: string | null
    ) =>
      ["reviews", "page", waiterId, sort, ratingFilter ?? "all", tag ?? "all"] as const,
    breakdown: (waiterId: string) => ["reviews", "breakdown", waiterId] as const,
  },
  waiterCard: (waiterId: string) => ["waiterCard", waiterId] as const,
} as const;
