import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
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
import {
  useShiftAssignments,
  useShiftRoleRequirements,
  useUpdateInternalShift,
} from "@/features/assignments/hooks";
import { DayPicker } from "@/features/shifts/DayPicker";
import { TimeField } from "@/features/shifts/TimeField";
import type { Shift } from "@/features/shifts/types";

// "HH:MM[:SS]" -> Date di oggi con quell'orario (per i TimeField).
function timeToDate(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

type SeededProps = {
  shift: Shift;
  initialTargets: Record<string, number>;
  initialStaffIds: string[];
};

function EditForm({ shift, initialTargets, initialStaffIds }: SeededProps) {
  const router = useRouter();
  const toast = useToast();
  const staffQuery = useVenueStaff(shift.venue_id);
  // Solo staff confermato (come in creazione).
  const staff = (staffQuery.data ?? []).filter(
    (m) => m.link_status === "active"
  );
  const update = useUpdateInternalShift(shift.id);

  const [date, setDate] = useState(new Date(`${shift.date}T00:00:00`));
  const [start, setStart] = useState(timeToDate(shift.start_time));
  const [end, setEnd] = useState(timeToDate(shift.end_time));
  const [targets, setTargets] = useState<Record<string, number>>(initialTargets);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialStaffIds)
  );
  const [note, setNote] = useState(shift.description ?? "");

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
    if (selected.size === 0) {
      toast.show("Seleziona almeno una persona.", "error");
      return;
    }
    const dateStr = toDateString(date);
    update.mutate(
      {
        title: `Turno · ${formatDate(dateStr)}`,
        date: dateStr,
        start_time: toTimeString(start),
        end_time: toTimeString(end),
        description: note.trim() || null,
        roleTargets: STAFF_ROLES.map((role) => ({
          role: role as string,
          count: targets[role] ?? 0,
        })),
        staffIds: [...selected],
      },
      {
        onSuccess: () => {
          toast.show("Turno aggiornato");
          router.back();
        },
        onError: () =>
          toast.show("Impossibile salvare le modifiche. Riprova.", "error"),
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
          label={update.isPending ? "Salvataggio…" : "Salva modifiche"}
          disabled={update.isPending || selected.size === 0}
          onPress={onSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Carica fabbisogno + assegnati e monta il form con i valori correnti. */
export function InternalShiftEditForm({ shift }: { shift: Shift }) {
  const reqsQuery = useShiftRoleRequirements(shift.id);
  const assignmentsQuery = useShiftAssignments(shift.id);

  if (reqsQuery.isLoading || assignmentsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-0">
        <ActivityIndicator color="#EAB54C" />
      </View>
    );
  }

  const initialTargets = Object.fromEntries(
    (reqsQuery.data ?? []).map((r) => [r.role, r.count])
  );
  const initialStaffIds = (assignmentsQuery.data ?? [])
    .map((a) => a.staff_member_id)
    .filter(Boolean);

  return (
    <EditForm
      key={shift.id}
      shift={shift}
      initialTargets={initialTargets}
      initialStaffIds={initialStaffIds}
    />
  );
}
