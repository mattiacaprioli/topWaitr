import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@/tw";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { useMyVenue } from "@/features/venues/hooks";
import { useCreateShift } from "@/features/shifts/hooks";
import { ShiftFormView } from "@/features/shifts/ShiftFormView";
import { formToShiftFields } from "@/features/shifts/form";
import { StaffShiftForm } from "@/features/assignments/StaffShiftForm";
import type { ShiftForm } from "@/features/shifts/schema";

type Mode = "staff" | "extra";

function defaultTime(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** "Cerco un extra": il turno marketplace classico (candidature). */
function ExtraShiftForm({ venueId }: { venueId: string | undefined }) {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateShift(venueId);

  const onSubmit = (values: ShiftForm) => {
    if (!venueId) {
      toast.show("Configura prima il tuo locale.", "error");
      return;
    }
    create.mutate(
      { venue_id: venueId, ...formToShiftFields(values) },
      {
        onSuccess: () => {
          toast.show("Turno pubblicato");
          router.back();
        },
        onError: () =>
          toast.show("Impossibile pubblicare il turno. Riprova.", "error"),
      }
    );
  };

  return (
    <ShiftFormView
      defaultValues={{
        title: "",
        date: new Date(),
        start: defaultTime(18),
        end: defaultTime(23),
        positions: "1",
        rate: "",
        dressCode: "",
        requirements: "",
        description: "",
      }}
      submitLabel="Pubblica turno"
      pendingLabel="Pubblicazione…"
      pending={create.isPending}
      onSubmit={onSubmit}
    />
  );
}

export default function NewShiftScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const venueId = useMyVenue(userId).data?.id;
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("staff");

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-6">
        <ScreenHeader eyebrow="Turno" title="Nuovo turno" />
      </View>
      <View className="px-6 pt-5">
        <View className="flex-row gap-1 rounded-2xl border border-border bg-bg-card p-1">
          {(
            [
              { id: "staff", label: "Chiamo il mio staff" },
              { id: "extra", label: "Cerco un extra" },
            ] as { id: Mode; label: string }[]
          ).map((opt) => {
            const active = opt.id === mode;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setMode(opt.id)}
                className={cn(
                  "flex-1 items-center rounded-xl py-2.5",
                  active && "bg-bg-2"
                )}
              >
                <Text
                  className={cn(
                    "text-sm",
                    active ? "font-sans-semibold text-t1" : "text-t3"
                  )}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {mode === "staff" ? (
        <StaffShiftForm venueId={venueId} />
      ) : (
        <ExtraShiftForm venueId={venueId} />
      )}
    </View>
  );
}
