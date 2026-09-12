import { Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import {
  formatDate,
  formatHours,
  formatShiftRange,
  shiftDurationHours,
} from "@/lib/format";
import { shiftCounts } from "@/features/assignments/coverage";
import type { Enums } from "@/types/database";
import type { ShiftWithCount } from "./types";

const STATUS_LABEL: Record<Enums<"shift_status">, string> = {
  open: "Aperto",
  closed: "Chiuso",
  cancelled: "Annullato",
};

/** Manager-facing shift row: stato, quando, durata e copertura dello staff. */
export function ManagerShiftCard({
  shift,
  onPress,
}: {
  shift: ShiftWithCount;
  onPress: () => void;
}) {
  const cancelled = shift.status === "cancelled";
  const { filled: covered, total } = shiftCounts(shift);
  return (
    <Card
      className={cn("rounded-3xl border-border-2 p-5", cancelled && "opacity-60")}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-base font-sans-bold text-t1">
          {shift.title}
        </Text>
        <Pill label={STATUS_LABEL[shift.status]} variant={shift.status} />
      </View>
      <Text className="mt-1 text-sm text-t2">
        {formatDate(shift.date)} ·{" "}
        {formatShiftRange(shift.start_time, shift.end_time)}
      </Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-sm text-t3">
          {formatHours(shiftDurationHours(shift.start_time, shift.end_time))}
        </Text>
        <Text className="text-sm font-sans-semibold text-gold">
          {covered}/{total} coperti
        </Text>
      </View>
      {/* Su un annullato la barra sembrerebbe un invito a coprire il turno. */}
      {!cancelled ? (
        <ProgressBar
          className="mt-2.5"
          progress={total > 0 ? Math.min(1, covered / total) : 0}
        />
      ) : null}
    </Card>
  );
}
