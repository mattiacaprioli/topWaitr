import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useMyVenue } from "@/features/venues/hooks";
import { useChatUnreadCount } from "@/features/chat/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { cn } from "@/lib/cn";
import { Button, Placeholder, QueryError, Spinner } from "./ui/primitives";
import { VenueContext } from "./lib/venue";

type NavItem = { to: string; label: string; badge?: "chat" | "notifiche" };

const NAV: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/planning", label: "Planning" },
  { to: "/copertura", label: "Copertura" },
  { to: "/ore", label: "Ore" },
  { to: "/staff", label: "Staff" },
  { to: "/candidature", label: "Candidature" },
  { to: "/storico", label: "Storico" },
  { to: "/chat", label: "Messaggi", badge: "chat" },
  { to: "/notifiche", label: "Notifiche", badge: "notifiche" },
  { to: "/locale", label: "Locale" },
  { to: "/impostazioni", label: "Impostazioni" },
];

export function AppLayout() {
  const { session, profile, signOut } = useAuth();
  const venueQuery = useMyVenue(session!.user.id);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Aggiornati in tempo reale da RealtimeSync (invalida chat.unreadAll) e dal
  // canale notifications.
  const chatUnread = useChatUnreadCount(session!.user.id).data ?? 0;
  const notifUnread = useUnreadCount(session!.user.id).data ?? 0;

  // "Locale" è l'unico posto da cui crearne uno, e "Impostazioni" deve restare
  // raggiungibile comunque (uscire, cancellare l'account): entrambe passano il
  // gate anche senza locale.
  const VENUE_FREE = ["/locale", "/impostazioni"];
  const needsVenue = !venueQuery.data && !VENUE_FREE.includes(pathname);

  return (
    <div className="flex min-h-dvh">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border-2 bg-bg-card p-4">
        <div className="mb-6 px-2">
          <div className="mb-3 h-1 w-8 rounded-full bg-gold" />
          <p className="font-serif text-lg leading-tight text-t1">
            {venueQuery.data?.name ?? "topWaitr"}
          </p>
          <p className="mt-0.5 truncate text-xs text-t4">
            {profile?.full_name ?? session?.user.email}
          </p>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const count =
              item.badge === "chat"
                ? chatUnread
                : item.badge === "notifiche"
                  ? notifUnread
                  : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                // `end` solo sulla Home: senza, "/" resterebbe attiva ovunque.
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "focus-gold flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-gold/15 text-gold"
                      : "text-t2 hover:bg-bg-2 hover:text-t1"
                  )
                }
              >
                {item.label}
                {count > 0 ? (
                  <span className="rounded-full bg-gold px-1.5 text-[11px] font-bold text-gold-ink">
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <Button className="w-full" onClick={() => void signOut()}>
            Esci
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-8">
        {venueQuery.isPending ? (
          <Spinner />
        ) : venueQuery.isError ? (
          <QueryError error={venueQuery.error} />
        ) : needsVenue ? (
          // Senza locale non esiste nulla da gestire: ogni query di questa
          // dashboard è ancorata a venue_id.
          <Placeholder
            title="Nessun locale collegato a questo account"
            detail="Crea il locale per iniziare a programmare i turni."
            action={
              <Button variant="gold" onClick={() => navigate("/locale")}>
                Crea il locale
              </Button>
            }
          />
        ) : (
          <VenueContext.Provider value={venueQuery.data ?? null}>
            <Outlet />
          </VenueContext.Provider>
        )}
      </main>
    </div>
  );
}
