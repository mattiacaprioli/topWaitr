import { ActivityIndicator } from "react-native";
import { Text, View } from "@/tw";
import { Mono } from "@/components/ui/Mono";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { StatCard } from "@/components/ui/StatCard";
import { formatHours } from "@/lib/format";
import { useStaffAssignments } from "@/features/assignments/hooks";
import { assignmentHours, isWorked } from "@/features/assignments/hours";
import { useWaiterPublicCard } from "@/features/reviews/hooks";

/** Performance di un membro: turni svolti, ore totali, affidabilità, rating clienti. */
export function StaffPerformanceSection({
  staffMemberId,
  waiterId,
}: {
  staffMemberId: string;
  waiterId: string | null;
}) {
  const query = useStaffAssignments(staffMemberId);
  const assignments = query.data ?? [];
  const card = useWaiterPublicCard(waiterId ?? undefined).data ?? null;

  const today = new Date().toISOString().slice(0, 10);
  const past = assignments.filter((a) => a.shift != null && a.shift.date < today);
  const worked = past.filter((a) => isWorked(a.status));
  const noShow = past.filter((a) => a.status === "no_show").length;
  const declined = past.filter((a) => a.status === "declined").length;
  const totalPast = past.length;
  const reliability = totalPast > 0 ? worked.length / totalPast : null;
  const totalHours = worked.reduce(
    (sum, a) => sum + assignmentHours(a.status, a.worked_hours, a.shift),
    0
  );

  return (
    <View className="gap-3">
      <Mono>Performance</Mono>

      {query.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-2 self-start" />
      ) : (
        <>
          {waiterId ? (
            <View className="flex-row items-center justify-between rounded-2xl border border-border-2 bg-bg-card px-4 py-3">
              <Text className="text-sm text-t2">Valutazione clienti</Text>
              <RatingBadge
                avg={card?.rating_avg ?? null}
                count={card?.rating_count ?? null}
              />
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <StatCard value={String(worked.length)} label="turni svolti" />
            <StatCard value={formatHours(totalHours)} label="ore totali" />
          </View>

          {reliability != null ? (
            <View className="gap-2 rounded-2xl border border-border bg-bg-card px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-t2">Affidabilità</Text>
                <Text className="text-sm font-sans-semibold text-gold">
                  {Math.round(reliability * 100)}%
                </Text>
              </View>
              <ProgressBar progress={reliability} />
              {noShow + declined > 0 ? (
                <Text className="text-xs text-t3">
                  {noShow} assenze · {declined} rifiuti su {totalPast} turni
                </Text>
              ) : (
                <Text className="text-xs text-t3">
                  Sempre presente su {totalPast}{" "}
                  {totalPast === 1 ? "turno" : "turni"}
                </Text>
              )}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
