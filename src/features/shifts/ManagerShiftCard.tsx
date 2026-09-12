import { Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { Mono } from "@/components/ui/Mono";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { shiftCounts } from "@/features/assignments/coverage";
import {
  formatDayLabel,
  formatHours,
  formatTime,
  isOvernightShift,
  shiftDurationHours,
  shiftSlotLabel,
} from "@/lib/format";
import type { ShiftWithCount } from "./types";

/**
 * Il titolo autogenerato dai vecchi form mobile: la data, cioè esattamente
 * quello che l'intestazione del giorno dice già. Quando lo si riconosce si
 * ripiega sulla fascia oraria, che almeno distingue due turni dello stesso
 * giorno. Un titolo scritto a mano dalla dashboard web passa invece intatto.
 */
const AUTO_TITLE = /^Turno · /;

function shiftLabel(shift: ShiftWithCount): string {
  const title = shift.title?.trim();
  if (title && !AUTO_TITLE.test(title)) return title;
  return shiftSlotLabel(shift.start_time);
}

/**
 * Un turno visto dal locale: quando, che fascia, quanta gente manca.
 *
 * Prima la card dedicava la riga più forte al titolo (che era la data) e la
 * metà inferiore a una barra dorata piena, cioè a confermare che andava tutto
 * bene; il turno **scoperto** — l'unico su cui c'è qualcosa da fare — si
 * distingueva per una barra più corta alta un pixel. Ora è il contrario: chi è
 * a posto sta zitto, chi è scoperto porta barra arancio e «manca N».
 */
export function ManagerShiftCard({
  shift,
  onPress,
  variant = "agenda",
}: {
  shift: ShiftWithCount;
  onPress: () => void;
  /** `compact` porta con sé il giorno: è per la home, che non ha un'agenda. */
  variant?: "agenda" | "compact";
}) {
  const cancelled = shift.status === "cancelled";
  const closed = shift.status === "closed";
  const { filled, total, short } = shiftCounts(shift);
  // Un turno annullato non è scoperto: non deve coprirlo più nessuno.
  const alert = short && !cancelled;
  const label = shiftLabel(shift);
  const overnight = isOvernightShift(shift.start_time, shift.end_time);

  const bar = cancelled || closed ? "bg-t4" : alert ? "bg-warning" : "bg-gold";

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "flex-row items-center gap-3 rounded-2xl border-border-2 p-3.5",
          cancelled && "opacity-60"
        )}
        onPress={onPress}
      >
        <View className={cn("h-8 w-1 rounded-full", bar)} />
        <View className="items-start">
          <Text
            className="text-[15px] font-sans-bold text-t1"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatTime(shift.start_time)}
          </Text>
          <Mono>{formatDayLabel(shift.date)}</Mono>
        </View>
        <View className="flex-1">
          <Text
            className="text-[15px] font-sans-semibold text-t1"
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            className={cn(
              "text-[13px]",
              alert ? "font-sans-semibold text-warning" : "text-t2"
            )}
          >
            {alert ? `manca ${total - filled}` : `${filled}/${total} coperti`}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "rounded-3xl border-border-2 p-4",
        cancelled && "opacity-60"
      )}
      onPress={onPress}
    >
      <View className="flex-row gap-3.5">
        <View className={cn("w-1 rounded-full", bar)} />

        <View className="items-start pt-0.5">
          <Text
            className="text-lg font-sans-bold text-t1"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatTime(shift.start_time)}
          </Text>
          <View className="flex-row items-start gap-0.5">
            <Text
              className="text-sm text-t2"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatTime(shift.end_time)}
            </Text>
            {/* Il turno finisce il giorno dopo: senza questo, 17:00–01:00 si
                legge come un turno che finisce sedici ore prima di iniziare. */}
            {overnight ? <Mono gold>+1</Mono> : null}
          </View>
          <Mono className="mt-1">
            {formatHours(shiftDurationHours(shift.start_time, shift.end_time))}
          </Mono>
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-[15px] font-sans-bold text-t1"
              numberOfLines={1}
            >
              {label}
            </Text>
            {/* Nessuna etichetta per «Aperto»: è lo stato normale, e dirlo su
                ogni card in verde toglieva risalto a quelle che un problema ce
                l'hanno davvero. */}
            {alert ? (
              <Pill
                label={`manca ${total - filled}`}
                variant="pending"
                icon="alert"
              />
            ) : cancelled ? (
              <Pill label="Annullato" variant="cancelled" />
            ) : closed ? (
              <Pill label="Chiuso" variant="closed" />
            ) : null}
          </View>
          {/* Il rapporto resta neutro anche quando manca qualcuno: l'allarme
              lo danno già la barra e la pill, e ripeterlo in arancio faceva
              gridare due volte la stessa cosa. */}
          <Text className="mt-1.5 text-[13px] text-t2">
            {total > 0 ? `${filled}/${total} coperti` : "Nessun fabbisogno"}
          </Text>
        </View>
      </View>
    </Card>
  );
}
