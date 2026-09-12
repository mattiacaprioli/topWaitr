import { Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { formatDate, formatShiftRange } from "@/lib/format";
import type { ShiftWithVenue } from "@/features/shifts/types";
import type { Enums } from "@/types/database";

const STATUS: Record<
  Enums<"assignment_status">,
  { label: string; variant: "accepted" | "pending" | "cancelled" }
> = {
  confirmed: { label: "Confermato", variant: "accepted" },
  assigned: { label: "Da confermare", variant: "pending" },
  declined: { label: "Rifiutato", variant: "cancelled" },
  no_show: { label: "Assente", variant: "cancelled" },
};

/**
 * Un turno assegnato, visto dal professionista: locale, titolo, stato, quando.
 *
 * Niente compenso: sui turni interni `hourly_rate` non è un dato che il locale
 * espone al professionista, ed è per questo che anche il dettaglio turno
 * (`(waiter)/shift/[id]`) non mostra la riga "Compenso".
 */
export function MyShiftCard({
  shift,
  status,
  onPress,
}: {
  shift: ShiftWithVenue;
  status: Enums<"assignment_status">;
  onPress: () => void;
}) {
  const s = STATUS[status];
  return (
    <Card className="rounded-3xl border-border-2 p-5" onPress={onPress}>
      <View className="flex-row items-start gap-3">
        <Avatar
          uri={shift.venue?.logo_url}
          name={shift.venue?.name ?? "Locale"}
          size={44}
        />
        <View className="flex-1">
          <Text className="text-base font-sans-bold text-t1" numberOfLines={1}>
            {shift.venue?.name ?? "Locale"}
          </Text>
          <Text className="mt-0.5 text-sm text-t3" numberOfLines={1}>
            {shift.title}
          </Text>
        </View>
        <Pill label={s.label} variant={s.variant} />
      </View>
      <View className="mt-3 flex-row items-center gap-2">
        <Icon name="calendar" size={15} color="#8c857a" />
        <Text className="text-sm text-t2">
          {formatDate(shift.date)} ·{" "}
          {formatShiftRange(shift.start_time, shift.end_time)}
        </Text>
      </View>
    </Card>
  );
}
