import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { NotificationList } from "@/features/notifications/NotificationList";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks";
import type { Notification } from "@/features/notifications/api";
import { useAuth } from "@/lib/auth";

export default function WaiterNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session!.user.id;

  const query = useNotifications(userId);
  const items = query.data ?? [];
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead(userId);
  const hasUnread = items.some((n) => n.read_at == null);

  const onOpen = (n: Notification) => {
    if (n.read_at == null) markRead.mutate(n.id);
    if (n.type === "staff_invite") {
      router.push("/(waiter)/inviti");
      return;
    }
    if (n.related_id) router.push(`/(waiter)/shift/${n.related_id}`);
  };

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5 pb-2">
        <ScreenHeader eyebrow="Account" title="Notifiche" />
      </View>
      <NotificationList
        notifications={items}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        onOpen={onOpen}
        onMarkAll={() => markAll.mutate()}
        hasUnread={hasUnread}
        contentPaddingBottom={insets.bottom + 24}
      />
    </View>
  );
}
