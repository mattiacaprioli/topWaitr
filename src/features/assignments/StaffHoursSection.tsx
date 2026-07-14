import { ActivityIndicator } from "react-native";
import { Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { Mono } from "@/components/ui/Mono";
import { StatCard } from "@/components/ui/StatCard";
import { formatDate, formatHours, formatTime } from "@/lib/format";
import { useStaffAssignments } from "@/features/assignments/hooks";
import { assignmentHours, isWorked } from "@/features/assignments/hours";

/** Ore & presenze di un membro dell'organico (turni interni già svolti). */
export function StaffHoursSection({ staffMemberId }: { staffMemberId: string }) {
  const query = useStaffAssignments(staffMemberId);
  const assignments = query.data ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7); // "YYYY-MM"

  // Turni conclusi e svolti (non rifiutati/assenti).
  const worked = assignments.filter(
    (a) => a.shift != null && a.shift.date < today && isWorked(a.status)
  );
  const thisMonth = worked.filter((a) => a.shift!.date.startsWith(monthPrefix));
  const monthHours = thisMonth.reduce(
    (sum, a) => sum + assignmentHours(a.status, a.worked_hours, a.shift),
    0
  );
  const recent = worked.slice(0, 6);

  return (
    <View className="gap-3">
      <Mono>Ore &amp; presenze</Mono>

      {query.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-2 self-start" />
      ) : (
        <>
          <View className="flex-row gap-3">
            <StatCard value={formatHours(monthHours)} label="ore questo mese" />
            <StatCard value={String(thisMonth.length)} label="turni questo mese" />
          </View>

          {recent.length > 0 ? (
            <View className="gap-2">
              {recent.map((a) => (
                <Card key={a.id} className="rounded-2xl border-border-2 px-4 py-3">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm font-sans-semibold text-t1">
                        {formatDate(a.shift!.date)}
                      </Text>
                      <Text className="text-xs text-t3">
                        {formatTime(a.shift!.start_time)}–
                        {formatTime(a.shift!.end_time)}
                      </Text>
                    </View>
                    <Text className="text-sm font-sans-semibold text-gold">
                      {formatHours(assignmentHours(a.status, a.worked_hours, a.shift))}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-t3">
              Nessun turno svolto ancora.
            </Text>
          )}
        </>
      )}
    </View>
  );
}
