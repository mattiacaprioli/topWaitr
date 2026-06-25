import { z } from "zod";

export const shiftSchema = z
  .object({
    title: z.string().trim().min(1, "Inserisci un titolo per il turno."),
    date: z.date(),
    start: z.date(),
    end: z.date(),
    positions: z.string().regex(/^\d+$/, "Numero di posizioni non valido"),
    rate: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || !Number.isNaN(parseFloat(v.replace(",", "."))),
        "Paga oraria non valida"
      ),
    dressCode: z.string().trim(),
    requirements: z.string().trim(),
    description: z.string().trim(),
  })
  .refine((v) => v.end.getTime() > v.start.getTime(), {
    message: "L'orario di fine deve essere dopo l'inizio.",
    path: ["end"],
  });

export type ShiftForm = z.infer<typeof shiftSchema>;
