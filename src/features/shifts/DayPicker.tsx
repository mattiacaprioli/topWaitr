import { useMemo } from "react";
import { ScrollView } from "@/tw";
import { SelectChip } from "@/components/ui/SelectChip";
import { toDateString } from "@/lib/format";

const dayFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function nextDays(count: number): Date[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

type Props = {
  value: Date;
  onChange: (d: Date) => void;
  /** How many days from today to offer (default 14). */
  count?: number;
};

/** Horizontal strip of day chips (prototype's "Giorno" selector). Bleeds to the
 * screen edge — expects a parent with `p-6` horizontal padding. */
export function DayPicker({ value, onChange, count = 14 }: Props) {
  const selected = toDateString(value);
  const days = useMemo(() => {
    const base = nextDays(count);
    // Arrivando dall'agenda con un giorno già scelto, quel giorno può cadere
    // oltre la finestra: senza allungarla non ci sarebbe nessun chip attivo e
    // il form sembrerebbe puntare a tutt'altra data.
    if (base.some((d) => toDateString(d) === selected)) return base;
    const extra = new Date(`${selected}T00:00:00`);
    return [...base, extra].sort((a, b) => a.getTime() - b.getTime());
  }, [count, selected]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -24 }}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
    >
      {days.map((d) => (
        <SelectChip
          key={toDateString(d)}
          label={dayFmt.format(d)}
          active={toDateString(d) === selected}
          onPress={() => onChange(d)}
        />
      ))}
    </ScrollView>
  );
}
