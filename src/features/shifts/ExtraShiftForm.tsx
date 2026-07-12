import { type ReactNode, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import { GoldButton } from "@/components/ui/GoldButton";
import { Mono } from "@/components/ui/Mono";
import { SelectChip } from "@/components/ui/SelectChip";
import { shiftDurationHours, toDateString, toTimeString } from "@/lib/format";
import { useToast } from "@/providers/Toast";
import { useCreateShift } from "@/features/shifts/hooks";
import { DayPicker } from "@/features/shifts/DayPicker";
import { TimeField } from "@/features/shifts/TimeField";

const ROLES = [
  "Cameriere",
  "Chef de rang",
  "Sommelier",
  "Runner",
  "Barista",
  "Hostess",
  "Lavapiatti",
];

const BADGES = [
  "Veloce",
  "Cortese",
  "Vino",
  "Cocktail",
  "Multi",
  "Gentile",
  "Eventi",
];

const RATE_MIN = 8;
const RATE_MAX = 30;

function defaultTime(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

type Props = {
  venueId: string | undefined;
  /** Rendered at the top of the scroll (the shared mode toggle). */
  header?: ReactNode;
};

/** "Cerco un extra": turno marketplace, con selettori a chip come nel prototipo. */
export function ExtraShiftForm({ venueId, header }: Props) {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateShift(venueId);

  const [role, setRole] = useState(ROLES[0]);
  const [date, setDate] = useState(new Date());
  const [start, setStart] = useState(defaultTime(19));
  const [end, setEnd] = useState(defaultTime(23));
  const [rate, setRate] = useState(12);
  const [positions, setPositions] = useState(1);
  const [badges, setBadges] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");

  const hours = shiftDurationHours(toTimeString(start), toTimeString(end));
  const total = Math.round(rate * hours);

  function toggleBadge(b: string) {
    setBadges((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }

  function onSubmit() {
    if (!venueId) {
      toast.show("Configura prima il tuo locale.", "error");
      return;
    }
    create.mutate(
      {
        venue_id: venueId,
        kind: "marketplace",
        title: role,
        date: toDateString(date),
        start_time: toTimeString(start),
        end_time: toTimeString(end),
        positions_total: Math.max(1, positions),
        hourly_rate: rate,
        dress_code: null,
        description: note.trim() || null,
        requirements: badges.size ? [...badges] : null,
      },
      {
        onSuccess: () => {
          toast.show("Turno pubblicato");
          router.back();
        },
        onError: () =>
          toast.show("Impossibile pubblicare il turno. Riprova.", "error"),
      }
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerClassName="p-6 gap-7"
        keyboardShouldPersistTaps="handled"
      >
        {header}

        {/* Ruolo cercato */}
        <View className="gap-3">
          <Mono>Ruolo cercato</Mono>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -24 }}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          >
            {ROLES.map((r) => (
              <SelectChip
                key={r}
                label={r}
                active={r === role}
                onPress={() => setRole(r)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Giorno */}
        <View className="gap-3">
          <Mono>Giorno</Mono>
          <DayPicker value={date} onChange={setDate} />
        </View>

        {/* Dalle / Alle */}
        <View className="flex-row gap-4">
          <TimeField
            className="flex-1"
            label="Dalle"
            value={start}
            onChange={setStart}
          />
          <TimeField
            className="flex-1"
            label="Alle"
            value={end}
            onChange={setEnd}
          />
        </View>

        {/* Compenso */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Mono>Paga oraria</Mono>
            <Mono gold>{`€ ${rate}/h`}</Mono>
          </View>
          <View className="rounded-3xl border border-border bg-bg-card px-4 py-4">
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={RATE_MIN}
              maximumValue={RATE_MAX}
              step={1}
              value={rate}
              onValueChange={setRate}
              minimumTrackTintColor="#EAB54C"
              maximumTrackTintColor="rgba(255,240,220,0.14)"
              thumbTintColor="#F5C765"
            />
            <View className="mt-1 flex-row items-center justify-between">
              <Mono className="text-t4">{`€ ${RATE_MIN}`}</Mono>
              <Text className="font-sans text-xs text-t3">
                {`≈ € ${total} per il turno · ${hours % 1 === 0 ? hours : hours.toFixed(1)}h`}
              </Text>
              <Mono className="text-t4">{`€ ${RATE_MAX}`}</Mono>
            </View>
          </View>
        </View>

        {/* Persone */}
        <View className="flex-row items-center justify-between">
          <Mono>Persone</Mono>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => setPositions((p) => Math.max(1, p - 1))}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full border border-border-2 bg-bg-2"
            >
              <Text className="text-lg text-t1">−</Text>
            </Pressable>
            <Text className="w-6 text-center font-sans-semibold text-base text-t1">
              {positions}
            </Text>
            <Pressable
              onPress={() => setPositions((p) => Math.min(20, p + 1))}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full border border-border-2 bg-bg-2"
            >
              <Text className="text-lg text-t1">+</Text>
            </Pressable>
          </View>
        </View>

        {/* Badge richiesti */}
        <View className="gap-3">
          <Mono>Badge richiesti</Mono>
          <View className="flex-row flex-wrap gap-2">
            {BADGES.map((b) => (
              <SelectChip
                key={b}
                label={b}
                active={badges.has(b)}
                onPress={() => toggleBadge(b)}
              />
            ))}
          </View>
        </View>

        {/* Note */}
        <View className="gap-3">
          <Mono>Note · facoltative</Mono>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Es. divisa nera, esperienza con menù degustazione…"
            placeholderTextColor="#6A6358"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="h-28 rounded-2xl border border-border bg-bg-1 px-4 py-3.5 font-sans text-[16px] text-t1"
          />
        </View>

        <GoldButton
          className="mt-1"
          label={create.isPending ? "Pubblicazione…" : "Pubblica turno"}
          disabled={create.isPending}
          onPress={onSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
