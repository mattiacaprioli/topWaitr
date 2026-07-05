import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Inserisci un'email valida."),
  password: z.string().min(1, "Inserisci la password."),
});

// Il ruolo si sceglie in una schermata dedicata e arriva come parametro di rotta,
// quindi qui restano solo le credenziali.
export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Inserisci il tuo nome."),
  email: z.string().trim().email("Inserisci un'email valida."),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri."),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
