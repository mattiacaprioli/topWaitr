import { type ReactNode, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Mono } from "@/components/ui/Mono";
import { cn } from "@/lib/cn";
import { formatDate, toDateString, toTimeString } from "@/lib/format";
import { useToast } from "@/providers/Toast";
import { useVenueStaff } from "@/features/staff/hooks";
import { STAFF_ROLES } from "@/features/staff/roles";
import { useCreateInternalShift } from "@/features/assignments/hooks";
import { DayPicker } from "@/features/shifts/DayPicker";
import { TimeField } from "@/features/shifts/TimeField";

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

/** "Chiamo il mio staff": assegna un turno interno a uno o più membri dell'organico. */
export function StaffShiftForm({ venueId, header }: Props) {
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
  const [targets, setTargets] = useState<Record<string, number>>({});

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setTarget(role: string, delta: number) {
    setTargets((prev) => ({
      ...prev,
      [role]: Math.max(0, Math.min(20, (prev[role] ?? 0) + delta)),
    }));
  }

  const selectedMembers = staff.filter((m) => selected.has(m.id));

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
    const roleTargets = STAFF_ROLES.map((role) => ({
      role: role as string,
      count: targets[role] ?? 0,
    })).filter((t) => t.count > 0);
    create.mutate(
      {
        title: `Turno · ${formatDate(dateStr)}`,
        date: dateStr,
        start_time: toTimeString(start),
        end_time: toTimeString(end),
        description: note.trim() || null,
        staffIds: [...selected],
        roleTargets,
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
      behavior="padding"
    >
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerClassName="p-6 gap-7"
        keyboardShouldPersistTaps="handled"
      >
        {header}

        <View className="gap-3">
          <Mono>Giorno</Mono>
          <DayPicker value={date} onChange={setDate} />
        </View>

        <View className="flex-row gap-4">
          <TimeField className="flex-1" label="Dalle" value={start} onChange={setStart} />
          <TimeField className="flex-1" label="Alle" value={end} onChange={setEnd} />
        </View>

        <View className="gap-2">
          <Mono>Fabbisogno per ruolo · facoltativo</Mono>
          <View>
            {STAFF_ROLES.map((role) => {
              const target = targets[role] ?? 0;
              const assigned = selectedMembers.filter(
                (m) => m.role === role
              ).length;
              return (
                <View
                  key={role}
                  className="flex-row items-center justify-between py-1.5"
                >
                  <View className="flex-1">
                    <Text className="text-sm text-t1">{role}</Text>
                    {target > 0 ? (
                      <Text
                        className={cn(
                          "text-xs",
                          assigned >= target ? "text-success" : "text-t3"
                        )}
                      >
                        {assigned}/{target} assegnati
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-center gap-4">
                    <Pressable
                      onPress={() => setTarget(role, -1)}
                      hitSlop={8}
                      className="h-8 w-8 items-center justify-center rounded-full border border-border-2 bg-bg-2"
                    >
                      <Text className="text-base text-t1">−</Text>
                    </Pressable>
                    <Text className="w-5 text-center font-sans-semibold text-t1">
                      {target}
                    </Text>
                    <Pressable
                      onPress={() => setTarget(role, 1)}
                      hitSlop={8}
                      className="h-8 w-8 items-center justify-center rounded-full border border-border-2 bg-bg-2"
                    >
                      <Text className="text-base text-t1">+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

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
