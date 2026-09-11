import { z } from "zod";
import {
  SHIFT_RANGE_ERROR,
  isValidShiftRange,
  toTimeString,
} from "@/lib/format";

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
  // I picker datano inizio e fine allo stesso giorno, quindi confrontare gli
  // istanti direbbe che mezzanotte viene prima delle 16:00: si confrontano gli
  // orari, con la stessa regola del resto del progetto (un turno può scavalcare
  // la mezzanotte, non può iniziare e finire allo stesso minuto).
  .refine((v) => isValidShiftRange(toTimeString(v.start), toTimeString(v.end)), {
    message: SHIFT_RANGE_ERROR,
    path: ["end"],
  });

export type ShiftForm = z.infer<typeof shiftSchema>;
