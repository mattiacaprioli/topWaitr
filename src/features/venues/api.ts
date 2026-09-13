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

/**
 * Il logo del locale, scritto da solo.
 *
 * Separato da `saveVenue` perché la foto si carica **prima** di salvare il
 * resto del modulo, e spesso senza toccarlo: farla passare dal form avrebbe
 * significato o salvare campi non ancora compilati, o perdere la foto uscendo
 * senza salvare. Serve un locale già esistente — chi non ce l'ha ancora
 * compila prima il nome.
 */
export async function updateVenueLogo(
  venueId: string,
  logoUrl: string | null
): Promise<void> {
  const { error } = await supabase
    .from("venues")
    .update({ logo_url: logoUrl })
    .eq("id", venueId);
  if (error) throw new Error(error.message);
}

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
