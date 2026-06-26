import { z } from "zod";

export const waiterProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Inserisci il tuo nome."),
  city: z.string().trim(),
  bio: z.string().trim().max(180, "Massimo 180 caratteri."),
  primary_role: z.string().trim(),
  languages: z.string().trim(),
  specializations: z.string().trim(),
  experience: z.string().trim(),
});

export type WaiterProfileForm = z.infer<typeof waiterProfileSchema>;
