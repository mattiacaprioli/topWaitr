import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type Venue = Tables<"venues">;

export type VenueInput = {
  name: string;
  city: string | null;
  address: string | null;
  cuisine_type: string | null;
  description: string | null;
};

export async function getMyVenue(ownerId: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function saveVenue(
  ownerId: string,
  input: VenueInput,
  venueId?: string
): Promise<Venue> {
  if (venueId) {
    const { data, error } = await supabase
      .from("venues")
      .update(input)
      .eq("id", venueId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase
    .from("venues")
    .insert({ ...input, owner_id: ownerId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
