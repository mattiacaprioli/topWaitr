import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Scrivi un messaggio.")
    .max(1000, "Messaggio troppo lungo (max 1000 caratteri)."),
});

export type MessageForm = z.infer<typeof messageSchema>;
