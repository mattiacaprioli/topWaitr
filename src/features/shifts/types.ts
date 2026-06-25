import type { Tables } from "@/types/database";

export type Shift = Tables<"shifts">;

export type ShiftWithCount = Shift & {
  applications: { count: number }[];
};

export type ShiftWithVenue = Shift & {
  venue: Tables<"venues"> | null;
};
