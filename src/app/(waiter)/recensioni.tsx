import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { WaiterReviewsList } from "@/features/reviews/WaiterReviewsList";
import { useAuth } from "@/lib/auth";

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const waiterId = session!.user.id;

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5 pb-2">
        <ScreenHeader eyebrow="Reputazione" title="Recensioni" />
      </View>
      <WaiterReviewsList waiterId={waiterId} bottomInset={insets.bottom + 24} />
    </View>
  );
}
