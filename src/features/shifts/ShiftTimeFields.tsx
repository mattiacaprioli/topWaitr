import { Text, View } from "@/tw";
import {
  SHIFT_RANGE_ERROR,
  formatShiftSummary,
  isValidShiftRange,
  toDateString,
  toTimeString,
} from "@/lib/format";
import { TimeField } from "./TimeField";

type Props = {
  /** Giorno di **inizio** del turno: serve a dire in che giorno cade la fine. */
  date: Date;
  start: Date;
  end: Date;
  onStartChange: (d: Date) => void;
  onEndChange: (d: Date) => void;
};

/**
 * I due campi orario del turno con, sotto, il riepilogo della durata.
 *
 * Stanno insieme perché un turno notturno (22:00–04:00) letto come due orari
 * slegati sembra finire diciotto ore prima di iniziare: è il riepilogo a dire
 * che la fine cade il giorno dopo, ed è lì che si intercetta un orario digitato
 * per sbaglio. Condiviso dai tre form dell'app che scelgono un orario.
 */
export function ShiftTimeFields({
  date,
  start,
  end,
  onStartChange,
  onEndChange,
}: Props) {
  const valid = isValidShiftRange(toTimeString(start), toTimeString(end));

  return (
    <View className="gap-2.5">
      <View className="flex-row gap-4">
        <TimeField
          className="flex-1"
          label="Dalle"
          value={start}
          onChange={onStartChange}
        />
        <TimeField
          className="flex-1"
          label="Alle"
          value={end}
          onChange={onEndChange}
        />
      </View>
      {valid ? (
        <Text className="text-xs text-t3">
          {formatShiftSummary(
            toDateString(date),
            toTimeString(start),
            toTimeString(end)
          )}
        </Text>
      ) : (
        // Con inizio uguale a fine la durata varrebbe 24 ore tonde: è un orario
        // ancora da correggere, non una durata da annunciare.
        <Text className="text-xs font-sans-semibold text-error">
          {SHIFT_RANGE_ERROR}
        </Text>
      )}
    </View>
  );
}
