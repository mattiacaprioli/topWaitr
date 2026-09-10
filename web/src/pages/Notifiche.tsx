import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { webRouteForNotification } from "../lib/notificationRoute";
import {
  Button,
  PageHeader,
  Placeholder,
  QueryError,
  Spinner,
} from "../ui/primitives";

export function NotifichePage() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useNotifications(userId);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead(userId);

  if (isPending) return <Spinner />;
  if (isError) return <QueryError error={error} />;

  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <>
      <PageHeader
        title="Notifiche"
        subtitle={unread > 0 ? `${unread} da leggere` : "Tutto letto"}
        actions={
          unread > 0 ? (
            <Button onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              Segna tutte come lette
            </Button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <Placeholder
          title="Nessuna notifica"
          detail="Candidature, risposte dello staff e messaggi arrivano qui."
        />
      ) : (
        <div className="flex max-w-3xl flex-col gap-2">
          {items.map((n) => {
            const route = webRouteForNotification(n.type, n.related_id);
            const isUnread = !n.read_at;
            return (
              <button
                key={n.id}
                disabled={!route}
                onClick={() => {
                  if (isUnread) markRead.mutate(n.id);
                  if (route) navigate(route);
                }}
                className={cn(
                  "focus-gold rounded-2xl border p-4 text-left transition",
                  isUnread
                    ? "border-border-gold bg-gold/5"
                    : "border-border-2 bg-bg-card",
                  route ? "hover:bg-bg-1" : "cursor-default"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={cn(
                      "text-sm",
                      isUnread ? "font-semibold text-t1" : "text-t2"
                    )}
                  >
                    {n.title}
                  </p>
                  <span className="shrink-0 text-xs text-t4">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.body ? (
                  <p className="mt-1 text-xs leading-5 text-t3">{n.body}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
