import type { IconName } from "@/components/ui/Icon";
import type { Enums } from "@/types/database";

type Role = Enums<"user_role">;

export type IntroSlide = {
  icon: IconName;
  title: string;
  body: string;
};

// ⚠️ MANUTENZIONE — LEGGERE PRIMA DI TOCCARE LE FEATURE
// Questo è il testo mostrato UNA VOLTA ai nuovi utenti al primo avvio (per ruolo).
// È l'unica fonte della copy di onboarding: se cambi/aggiungi/togli una feature,
// AGGIORNA queste slide, altrimenti l'onboarding racconta un'app che non esiste più.
// Quando la monetizzazione sarà attiva, il "benvenuto in Pro" (mostrato al passaggio
// free→pro) vivrà qui accanto come PRO_INTRO_SLIDES, riusando lo stesso IntroCarousel.

export const INTRO_SLIDES: Record<Role, IntroSlide[]> = {
  waiter: [
    {
      icon: "star",
      title: "La tua reputazione è il tuo capitale",
      body: "Ogni cliente soddisfatto può recensirti. Le recensioni le porti con te, in ogni locale.",
    },
    {
      icon: "calendar",
      title: "I tuoi turni, sempre con te",
      body: "I locali per cui lavori ti assegnano i turni: li confermi e li vedi tutti qui.",
    },
    {
      icon: "qr",
      title: "Fatti recensire col QR",
      body: "A fine servizio mostra il tuo QR: il cliente ti lascia una recensione certificata.",
    },
  ],
  manager: [
    {
      icon: "users",
      title: "Organizza i turni col tuo staff",
      body: "Crea il tuo organico e assegna i turni in pochi tocchi.",
    },
    {
      icon: "clipboard",
      title: "Copertura sotto controllo",
      body: "Fabbisogno per ruolo, turni scoperti e ore lavorate, turno per turno.",
    },
    {
      icon: "sparkle",
      title: "Tutto sotto controllo",
      body: "Ore, copertura, chat e reputazione del tuo staff in un posto solo.",
    },
  ],
};
