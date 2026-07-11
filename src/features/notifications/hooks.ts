import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: qk.notifications.list(userId ?? ""),
    queryFn: () => getNotifications(userId as string),
    enabled: !!userId,
  });
}

/** Conteggio non letti per il badge della campanella. */
export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: qk.notifications.unread(userId ?? ""),
    queryFn: () => getUnreadCount(userId as string),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

export function useMarkAllNotificationsRead(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}
