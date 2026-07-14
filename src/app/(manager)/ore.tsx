import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { formatHours } from "@/lib/format";
import { exportHoursCsv, exportHoursPdf } from "@/lib/export";
import { useToast } from "@/providers/Toast";
import { useMyVenue } from "@/features/venues/hooks";
import { useVenueHoursSummary } from "@/features/assignments/hooks";

const monthFmt = new Intl.DateTimeFormat("it-IT", {
  month: "long",
  year: "numeric",
});

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const label = monthFmt.format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function VenueHoursScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session } = useAuth();
  const userId = session!.user.id;
  const venue = useMyVenue(userId).data ?? null;

  const [month, setMonth] = useState(currentMonth());
  const atCurrentMonth = month >= currentMonth();

  const query = useVenueHoursSummary(venue?.id, month);
  const rows = query.data ?? [];

  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const totalShifts = rows.reduce((s, r) => s + r.shifts_count, 0);
  const maxHours = rows.reduce((m, r) => Math.max(m, r.hours), 0);
  const label = monthLabel(month);

  async function onExport(kind: "pdf" | "csv") {
    if (!venue || rows.length === 0) return;
    try {
      if (kind === "pdf") {
        await exportHoursPdf(venue.name, label, rows, totalHours);
      } else {
        await exportHoursCsv(venue.name, label, rows);
      }
    } catch {
      toast.show("Export non riuscito. Riprova.", "error");
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 48,
        gap: 20,
      }}
    >
      <ScreenHeader eyebrow="Organico" title="Ore del mese" />

      {/* Selettore mese */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => setMonth((m) => shiftMonth(m, -1))}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-2"
        >
          <Icon name="chevL" size={20} color="#F8F4ED" />
        </Pressable>
        <Text className="text-base font-sans-semibold text-t1">{label}</Text>
        <Pressable
          disabled={atCurrentMonth}
          onPress={() => setMonth((m) => shiftMonth(m, 1))}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-2"
          style={atCurrentMonth ? { opacity: 0.35 } : undefined}
        >
          <Icon name="chevR" size={20} color="#F8F4ED" />
        </Pressable>
      </View>

      {query.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-10" />
      ) : query.isError ? (
        <QueryError onRetry={() => query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nessuna ora registrata"
          subtitle="Le ore dei turni interni conclusi di questo mese compariranno qui."
        />
      ) : (
        <>
          <Card className="rounded-3xl border-border-2 px-5 py-4">
            <Mono>Totale mese</Mono>
            <Text
              className="mt-1 text-3xl font-sans-bold text-t1"
              style={{ letterSpacing: -0.5 }}
            >
              {formatHours(totalHours)}
            </Text>
            <Text className="text-xs text-t3">
              {totalShifts} turni · {rows.length}{" "}
              {rows.length === 1 ? "persona" : "persone"}
            </Text>
          </Card>

          <View className="gap-4">
            {rows.map((r) => (
              <View key={r.staff_member_id} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-semibold text-t1">
                      {r.display_name}
                    </Text>
                    <Text className="text-xs text-t3">
                      {r.role ?? "—"} · {r.shifts_count} turni
                    </Text>
                  </View>
                  <Text className="text-sm font-sans-bold text-gold">
                    {formatHours(r.hours)}
                  </Text>
                </View>
                <ProgressBar progress={maxHours > 0 ? r.hours / maxHours : 0} />
              </View>
            ))}
          </View>

          <View className="mt-2 gap-2.5">
            <GoldButton label="Esporta PDF" onPress={() => onExport("pdf")} />
            <GhostButton label="Esporta CSV" onPress={() => onExport("csv")} />
          </View>
        </>
      )}
    </ScrollView>
  );
}
