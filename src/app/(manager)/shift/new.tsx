import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { useMyVenue } from "@/features/venues/hooks";
import { StaffShiftForm } from "@/features/assignments/StaffShiftForm";

export default function NewShiftScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const venueId = useMyVenue(userId).data?.id;
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-6 pb-4">
        <ScreenHeader
          eyebrow="Il tuo staff"
          goldEyebrow
          title="Nuovo turno"
          icon="close"
        />
      </View>

      <StaffShiftForm venueId={venueId} />
    </View>
  );
}
