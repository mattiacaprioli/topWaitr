import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Mono } from "@/components/ui/Mono";
import { PickerField } from "@/components/form/ControlledPicker";
import { cn } from "@/lib/cn";
import { formatDate, toDateString, toTimeString } from "@/lib/format";
import { useToast } from "@/providers/Toast";
import { useVenueStaff } from "@/features/staff/hooks";
import { useCreateInternalShift } from "@/features/assignments/hooks";

function defaultTime(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** "Chiamo il mio staff": assegna un turno interno a uno o più membri dell'organico. */
export function StaffShiftForm({ venueId }: { venueId: string | undefined }) {
  const router = useRouter();
  const toast = useToast();
  const staffQuery = useVenueStaff(venueId);
  // Solo staff confermato: gli inviti ancora da accettare non sono assegnabili.
  const staff = (staffQuery.data ?? []).filter(
    (m) => m.link_status === "active"
  );
  const create = useCreateInternalShift(venueId);

  const [date, setDate] = useState(new Date());
  const [start, setStart] = useState(defaultTime(18));
  const [end, setEnd] = useState(defaultTime(23));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSubmit() {
    if (!venueId) {
      toast.show("Configura prima il tuo locale.", "error");
      return;
    }
    if (selected.size === 0) {
      toast.show("Seleziona almeno una persona.", "error");
      return;
    }
    const dateStr = toDateString(date);
    create.mutate(
      {
        title: `Turno · ${formatDate(dateStr)}`,
        date: dateStr,
        start_time: toTimeString(start),
        end_time: toTimeString(end),
        description: note.trim() || null,
        staffIds: [...selected],
      },
      {
        onSuccess: () => {
          toast.show("Turno assegnato allo staff");
          router.back();
        },
        onError: () =>
          toast.show("Impossibile creare il turno. Riprova.", "error"),
      }
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-1"
        contentContainerClassName="p-6 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        <PickerField label="Giorno" mode="date" value={date} onChange={setDate} />
        <PickerField label="Dalle" mode="time" value={start} onChange={setStart} />
        <PickerField label="Alle" mode="time" value={end} onChange={setEnd} />

        <View className="gap-3">
          <Mono>Chi chiami</Mono>
          {staffQuery.isLoading ? (
            <ActivityIndicator color="#EAB54C" className="mt-2" />
          ) : staff.length === 0 ? (
            <EmptyState
              title="Nessuno nello staff"
              subtitle="Aggiungi prima qualcuno dalla scheda «Staff»."
            />
          ) : (
            <View className="gap-3">
              {staff.map((m) => {
                const active = selected.has(m.id);
                return (
                  <Card
                    key={m.id}
                    className={cn(
                      "rounded-3xl border-border-2 p-4",
                      active && "border-gold"
                    )}
                    onPress={() => toggle(m.id)}
                  >
                    <View className="flex-row items-center gap-3">
                      <Avatar
                        uri={m.waiter?.avatar_url ?? undefined}
                        name={m.display_name}
                        size={40}
                      />
                      <View className="flex-1">
                        <Text className="text-base font-sans-bold text-t1">
                          {m.display_name}
                        </Text>
                        {m.role ? (
                          <Text className="text-xs text-t3">{m.role}</Text>
                        ) : null}
                      </View>
                      <View
                        className={cn(
                          "h-6 w-6 items-center justify-center rounded-full border",
                          active ? "border-gold bg-gold" : "border-border"
                        )}
                      >
                        {active ? (
                          <Icon name="check" size={14} color="#1A1206" />
                        ) : null}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        <Input
          label="Note (facoltative)"
          value={note}
          onChangeText={setNote}
          placeholder="Es. divisa nera, servizio serale"
          multiline
          numberOfLines={3}
          className="h-20"
          textAlignVertical="top"
        />

        <GoldButton
          className="mt-1"
          label={
            create.isPending
              ? "Assegnazione…"
              : selected.size > 1
                ? `Assegna a ${selected.size} persone`
                : "Assegna turno"
          }
          disabled={create.isPending || selected.size === 0}
          onPress={onSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
