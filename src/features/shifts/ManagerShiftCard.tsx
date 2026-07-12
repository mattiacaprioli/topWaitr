import { Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDate, formatRate, formatTime } from "@/lib/format";
import type { Enums } from "@/types/database";
import type { ShiftWithCount } from "./types";

const STATUS_LABEL: Record<Enums<"shift_status">, string> = {
  open: "Aperto",
  closed: "Chiuso",
  cancelled: "Annullato",
};

/** Manager-facing shift row: status + slot + rate + applicant count. */
export function ManagerShiftCard({
  shift,
  onPress,
}: {
  shift: ShiftWithCount;
  onPress: () => void;
}) {
  const count = shift.applications[0]?.count ?? 0;
  return (
    <Card className="rounded-3xl border-border-2 p-5" onPress={onPress}>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-base font-sans-bold text-t1">
          {shift.title}
        </Text>
        <Pill label={STATUS_LABEL[shift.status]} variant={shift.status} />
      </View>
      <Text className="mt-1 text-sm text-t2">
        {formatDate(shift.date)} · {formatTime(shift.start_time)}–
        {formatTime(shift.end_time)}
      </Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-sm text-t3">{formatRate(shift.hourly_rate)}</Text>
        <Text className="text-sm font-sans-semibold text-gold">
          {count} candidatur{count === 1 ? "a" : "e"}
        </Text>
      </View>
    </Card>
  );
}
