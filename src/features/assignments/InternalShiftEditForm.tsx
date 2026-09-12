import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { ScrollView, View } from "@/tw";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { Mono } from "@/components/ui/Mono";
import {
  SHIFT_RANGE_ERROR,
  formatDate,
  isValidShiftRange,
  toDateString,
  toTimeString,
} from "@/lib/format";
import { useToast } from "@/providers/Toast";
import { useVenueStaff } from "@/features/staff/hooks";
import type { StaffMemberWithWaiter } from "@/features/staff/api";
import { useVenueRoles } from "@/features/roles/hooks";
import { RoleRequirementsField } from "@/features/assignments/RoleRequirementsField";
import {
  StaffAssignPicker,
  defaultRoleFor,
} from "@/features/assignments/StaffAssignPicker";
import {
  useShiftAssignments,
  useShiftRoleRequirements,
  useUpdateInternalShift,
} from "@/features/assignments/hooks";
import {
  isActiveAssignment,
  type AssignmentStatus,
} from "@/features/assignments/status";
import { DayPicker } from "@/features/shifts/DayPicker";
import { ShiftTimeFields } from "@/features/shifts/ShiftTimeFields";
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
  /** Stato dell'assegnazione già a sistema, per membro dell'organico. */
  initialStatuses: Record<string, AssignmentStatus>;
  /** Ruolo già scelto su questo turno, per membro dell'organico. */
  initialRoles: Record<string, string | null>;
};

function EditForm({
  shift,
  initialTargets,
  initialStatuses,
  initialRoles,
}: SeededProps) {
  const router = useRouter();
  const toast = useToast();
  const staffQuery = useVenueStaff(shift.venue_id);
  // Solo staff confermato (come in creazione).
  const staff = (staffQuery.data ?? []).filter(
    (m) => m.link_status === "active"
  );
  const rolesQuery = useVenueRoles(shift.venue_id);
  const roles = rolesQuery.data ?? [];
  const update = useUpdateInternalShift(shift.id);

  const [date, setDate] = useState(new Date(`${shift.date}T00:00:00`));
  const [start, setStart] = useState(timeToDate(shift.start_time));
  const [end, setEnd] = useState(timeToDate(shift.end_time));
  const [targets, setTargets] = useState<Record<string, number>>(initialTargets);
  const [selected, setSelected] =
    useState<Record<string, string | null>>(initialRoles);
  const [note, setNote] = useState(shift.description ?? "");

  function toggle(member: StaffMemberWithWaiter) {
    setSelected((prev) => {
      if (member.id in prev) {
        const next = { ...prev };
        delete next[member.id];
        return next;
      }
      return { ...prev, [member.id]: defaultRoleFor(member) };
    });
  }

  function setRole(staffId: string, roleId: string | null) {
    setSelected((prev) => ({ ...prev, [staffId]: roleId }));
  }

  function setTarget(roleId: string, delta: number) {
    setTargets((prev) => ({
      ...prev,
      [roleId]: Math.max(0, Math.min(20, (prev[roleId] ?? 0) + delta)),
    }));
  }

  /** Chi selezioni ora non ha ancora una riga: sarà `assigned` al salvataggio. */
  function memberStatus(id: string): AssignmentStatus {
    return initialStatuses[id] ?? "assigned";
  }

  const selectedIds = Object.keys(selected);
  // Chi ha rifiutato (o è mancato) resta in elenco ma non copre il suo ruolo:
  // contarlo faceva sembrare completo un fabbisogno ancora scoperto.
  const workingRoleIds = selectedIds
    .filter((id) => isActiveAssignment(memberStatus(id)))
    .map((id) => selected[id]);

  function onSubmit() {
    if (selectedIds.length === 0) {
      toast.show("Seleziona almeno una persona.", "error");
      return;
    }
    if (!isValidShiftRange(toTimeString(start), toTimeString(end))) {
      toast.show(SHIFT_RANGE_ERROR, "error");
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
        roleTargets: roles.map((role) => ({
          role_id: role.id,
          count: targets[role.id] ?? 0,
        })),
        staff: selectedIds.map((id) => ({
          staff_member_id: id,
          role_id: selected[id],
        })),
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
      behavior="padding"
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

        <ShiftTimeFields
          date={date}
          start={start}
          end={end}
          onStartChange={setStart}
          onEndChange={setEnd}
        />

        <RoleRequirementsField
          roles={roles}
          targets={targets}
          onChange={setTarget}
          assignedRoleIds={workingRoleIds}
        />

        <StaffAssignPicker
          staff={staff}
          loading={staffQuery.isLoading}
          value={selected}
          onToggle={toggle}
          onRoleChange={setRole}
          statusFor={memberStatus}
        />

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
          disabled={update.isPending || selectedIds.length === 0}
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
    (reqsQuery.data ?? []).map((r) => [r.role_id, r.count])
  );
  const initialStatuses = Object.fromEntries(
    (assignmentsQuery.data ?? []).map((a) => [a.staff_member_id, a.status])
  ) as Record<string, AssignmentStatus>;
  const initialRoles = Object.fromEntries(
    (assignmentsQuery.data ?? []).map((a) => [a.staff_member_id, a.role_id])
  ) as Record<string, string | null>;

  return (
    <EditForm
      key={shift.id}
      shift={shift}
      initialTargets={initialTargets}
      initialStatuses={initialStatuses}
      initialRoles={initialRoles}
    />
  );
}
