/**
 * Central query-key factory. Always build keys through here so invalidation
 * stays consistent across features.
 */
export const qk = {
  venues: {
    all: ["venues"] as const,
    mine: (ownerId: string) => ["venues", "mine", ownerId] as const,
  },
  shifts: {
    all: ["shifts"] as const,
    byVenue: (venueId: string) => ["shifts", "byVenue", venueId] as const,
    detail: (id: string) => ["shifts", "detail", id] as const,
  },
  applications: {
    all: ["applications"] as const,
    byShift: (shiftId: string) => ["applications", "byShift", shiftId] as const,
  },
} as const;
