import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Input } from "@/components/ui/Input";
import { GoldButton } from "@/components/ui/GoldButton";
import { useAuth } from "@/lib/auth";
import {
  formatDate,
  formatTime,
  toDateString,
  toTimeString,
} from "@/lib/format";
import { createShift, getMyVenue } from "@/lib/manager";

function defaultTime(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

type FieldProps = {
  label: string;
  value: Date;
  mode: "date" | "time";
  formatted: string;
  onChange: (d: Date) => void;
};

function PickerField({ label, value, mode, formatted, onChange }: FieldProps) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "ios") {
    return (
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-t2">{label}</Text>
        <DateTimePicker
          value={value}
          mode={mode}
          display="compact"
          themeVariant="dark"
          accentColor="#D4A843"
          onChange={(_, d) => d && onChange(d)}
        />
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-t2">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        className="rounded-xl border border-border bg-bg-2 px-4 py-3.5"
      >
        <Text className="text-base text-t1">{formatted}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode={mode}
          onChange={(_, d) => {
            setShow(false);
            if (d) onChange(d);
          }}
        />
      ) : null}
    </View>
  );
}

export default function NewShiftScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const userId = session!.user.id;

  const [venueId, setVenueId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date());
  const [start, setStart] = useState(defaultTime(18));
  const [end, setEnd] = useState(defaultTime(23));
  const [positions, setPositions] = useState("1");
  const [rate, setRate] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [requirements, setRequirements] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyVenue(userId).then((v) => setVenueId(v?.id ?? null));
  }, [userId]);

  async function onSubmit() {
    if (saving) return;
    if (!title.trim()) {
      setError("Inserisci un titolo per il turno.");
      return;
    }
    if (!venueId) {
      setError("Configura prima il tuo locale.");
      return;
    }
    const positionsNum = Math.max(1, parseInt(positions, 10) || 1);
    const rateNum = rate.trim()
      ? parseFloat(rate.replace(",", "."))
      : null;
    if (rateNum != null && Number.isNaN(rateNum)) {
      setError("Paga oraria non valida.");
      return;
    }

    setError(null);
    setSaving(true);
    const { error: err } = await createShift({
      venue_id: venueId,
      title: title.trim(),
      date: toDateString(date),
      start_time: toTimeString(start),
      end_time: toTimeString(end),
      positions_total: positionsNum,
      hourly_rate: rateNum,
      dress_code: dressCode.trim() || null,
      description: description.trim() || null,
      requirements: requirements.trim()
        ? requirements
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean)
        : null,
    });
    setSaving(false);
    if (err) {
      setError("Impossibile pubblicare il turno. Riprova.");
      return;
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-1"
        contentContainerClassName="p-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Titolo"
          value={title}
          onChangeText={setTitle}
          placeholder="Cameriere di sala — serata"
        />

        <PickerField
          label="Data"
          value={date}
          mode="date"
          formatted={formatDate(toDateString(date))}
          onChange={setDate}
        />
        <PickerField
          label="Inizio"
          value={start}
          mode="time"
          formatted={formatTime(toTimeString(start))}
          onChange={setStart}
        />
        <PickerField
          label="Fine"
          value={end}
          mode="time"
          formatted={formatTime(toTimeString(end))}
          onChange={setEnd}
        />

        <Input
          label="Posizioni"
          value={positions}
          onChangeText={setPositions}
          keyboardType="number-pad"
          placeholder="1"
        />
        <Input
          label="Paga oraria (€)"
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          placeholder="Opzionale — es. 10,50"
        />
        <Input
          label="Dress code"
          value={dressCode}
          onChangeText={setDressCode}
          placeholder="Opzionale — es. camicia nera"
        />
        <Input
          label="Requisiti"
          value={requirements}
          onChangeText={setRequirements}
          placeholder="Separati da virgola"
        />
        <Input
          label="Descrizione"
          value={description}
          onChangeText={setDescription}
          placeholder="Dettagli del turno"
          multiline
          numberOfLines={4}
          className="h-28"
          textAlignVertical="top"
        />

        {error ? <Text className="text-sm text-error">{error}</Text> : null}

        <GoldButton
          className="mt-2"
          label={saving ? "Pubblicazione…" : "Pubblica turno"}
          disabled={saving}
          onPress={onSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
