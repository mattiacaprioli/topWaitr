import { Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { formatDate, formatRate, formatShiftRange } from "@/lib/format";
import { shiftCounts } from "@/features/assignments/coverage";
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
  const internal = shift.kind === "internal";
  const cancelled = shift.status === "cancelled";
  const applicants = shift.applications[0]?.count ?? 0;
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
        {/* Un turno annullato deve dirlo anche se è interno: la pill "Staff"
            lo rendeva indistinguibile da uno attivo nella lista. */}
        {cancelled || !internal ? (
          <Pill label={STATUS_LABEL[shift.status]} variant={shift.status} />
        ) : (
          <Pill label="Staff" variant="tag" />
        )}
      </View>
      <Text className="mt-1 text-sm text-t2">
        {formatDate(shift.date)} ·{" "}
        {formatShiftRange(shift.start_time, shift.end_time)}
      </Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-sm text-t3">
          {internal ? "Turno interno" : formatRate(shift.hourly_rate)}
        </Text>
        <Text className="text-sm font-sans-semibold text-gold">
          {internal
            ? `${covered}/${total} coperti`
            : `${applicants} candidatur${applicants === 1 ? "a" : "e"}`}
        </Text>
      </View>
      {/* Su un annullato la barra sembrerebbe un invito a coprire il turno. */}
      {internal && !cancelled ? (
        <ProgressBar
          className="mt-2.5"
          progress={total > 0 ? Math.min(1, covered / total) : 0}
        />
      ) : null}
    </Card>
  );
}
