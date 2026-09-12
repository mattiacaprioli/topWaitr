import { z } from "zod";

/** Setup del profilo professionista: un passo solo (nome, città, ruolo). */
export const onboardingSchema = z.object({
  full_name: z.string().trim().min(1, "Inserisci il tuo nome."),
  city: z.string().trim(),
  // Testo libero dal 2026-09-12: non c'è più una lista da cui selezionare.
  primary_role: z.string().trim().min(1, "Inserisci il tuo ruolo principale."),
});

export type OnboardingForm = z.infer<typeof onboardingSchema>;
