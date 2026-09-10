import { z } from "zod";

/**
 * Schema del turno interno lato web.
 *
 * Non riusa `src/features/shifts/schema.ts` di proposito: quello è modellato sui
 * picker di React Native e porta `date`/`start`/`end` come oggetti `Date`, mentre
 * `<input type="date">` e `<input type="time">` restituiscono già stringhe nel
 * formato delle colonne DB. Convertirle avanti e indietro aggiungerebbe solo
 * superficie d'errore. L'invariante che conta — fine dopo inizio — è la stessa,
 * con lo stesso messaggio.
 *
 * Convenzione di ARCHITECTURE.md rispettata: niente `.default()` qui, i valori
 * iniziali stanno nei defaultValues del form.
 */
export const internalShiftSchema = z
  .object({
    title: z.string().trim().min(1, "Inserisci un titolo per il turno."),
    date: z.string().min(1, "Scegli la data."),
    start_time: z.string().min(1, "Scegli l'orario di inizio."),
    end_time: z.string().min(1, "Scegli l'orario di fine."),
    description: z.string().trim(),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "L'orario di fine deve essere dopo l'inizio.",
    path: ["end_time"],
  });

export type InternalShiftForm = z.infer<typeof internalShiftSchema>;
