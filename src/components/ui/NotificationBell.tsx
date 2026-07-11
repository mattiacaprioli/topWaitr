import { Pressable, Text, View } from "@/tw";
import { Icon } from "./Icon";

type Props = {
  count: number;
  onPress: () => void;
};

/** Campanella con badge del conteggio non letti. */
export function NotificationBell({ count, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-full border border-border-2 bg-bg-2"
    >
      <Icon name="bell" size={20} color="#F8F4ED" />
      {count > 0 ? (
        <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1">
          <Text className="font-sans-bold text-[10px] text-gold-ink">
            {count > 9 ? "9+" : String(count)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
