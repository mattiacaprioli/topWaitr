import { z } from "zod";

/** Step 1 · Il tuo profilo. `skills` (Step 2) vive nello stesso form. */
export const onboardingSchema = z.object({
  full_name: z.string().trim().min(1, "Inserisci il tuo nome."),
  city: z.string().trim(),
  primary_role: z.string().trim().min(1, "Seleziona un ruolo."),
  skills: z.array(z.string()),
});

export type OnboardingForm = z.infer<typeof onboardingSchema>;
