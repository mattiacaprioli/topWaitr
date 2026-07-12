import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@/tw";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useMyVenue } from "@/features/venues/hooks";
import { ExtraShiftForm } from "@/features/shifts/ExtraShiftForm";
import { StaffShiftForm } from "@/features/assignments/StaffShiftForm";

type Mode = "staff" | "extra";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "staff", label: "Chiamo il mio staff", hint: "Dal tuo organico" },
  { id: "extra", label: "Cerco un extra", hint: "Sul marketplace" },
];

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <View className="flex-row gap-3">
      {MODES.map((opt) => {
        const active = opt.id === mode;
        const content = (
          <View className="px-4 py-4">
            <Text
              className={cn(
                "text-base font-sans-semibold",
                active ? "text-gold-ink" : "text-t2"
              )}
            >
              {opt.label}
            </Text>
            <Text
              className={cn("mt-1 text-xs", !active && "text-t4")}
              style={active ? { color: "rgba(26,18,6,0.72)" } : undefined}
            >
              {opt.hint}
            </Text>
          </View>
        );
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            className="flex-1 overflow-hidden rounded-2xl"
          >
            {active ? (
              <LinearGradient
                colors={["#F5C765", "#D9A23F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                {content}
              </LinearGradient>
            ) : (
              <View className="rounded-2xl border border-border bg-bg-card">
                {content}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function NewShiftScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const venueId = useMyVenue(userId).data?.id;
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("staff");

  const header = <ModeToggle mode={mode} onChange={setMode} />;

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-6 pb-4">
        <ScreenHeader
          eyebrow="Nuovo turno"
          goldEyebrow
          title="Copri un turno"
          icon="close"
        />
      </View>

      {mode === "staff" ? (
        <StaffShiftForm venueId={venueId} header={header} />
      ) : (
        <ExtraShiftForm venueId={venueId} header={header} />
      )}
    </View>
  );
}
