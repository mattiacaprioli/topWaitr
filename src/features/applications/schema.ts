import { z } from "zod";

export const applicationSchema = z.object({
  // Messaggio di presentazione facoltativo (colonna applications.message).
  message: z
    .string()
    .trim()
    .max(500, "Messaggio troppo lungo (max 500 caratteri)."),
});

export type ApplicationForm = z.infer<typeof applicationSchema>;
