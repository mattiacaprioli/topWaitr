import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import { QueryError } from "@/components/ui/QueryError";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  useMyAssignedUpcoming,
  useRespondToAssignment,
} from "@/features/assignments/hooks";
import { useMyWorkHistoryTotals } from "@/features/assignments/history";
import { MyShiftCard } from "@/features/assignments/MyShiftCard";
import { useAuth } from "@/lib/auth";
import { formatHours } from "@/lib/format";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useToast } from "@/providers/Toast";

/**
 * L'agenda del professionista: i turni che i locali gli hanno assegnato.
 *
 * La conferma di presenza è inline perché è l'azione più frequente di tutta
 * l'app da questo lato — farla passare per il dettaglio turno significava due
 * tocchi in più per la cosa che si fa ogni settimana. Il rifiuto invece resta
 * dietro una conferma: avvisa il locale e non si torna indietro da soli.
 */
export default function WaiterShiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session } = useAuth();
  const waiterId = session!.user.id;

  const assignedQuery = useMyAssignedUpcoming(waiterId);
  const totals = useMyWorkHistoryTotals(waiterId);
  const respond = useRespondToAssignment();
  const pull = usePullToRefresh(() =>
    Promise.all([assignedQuery.refetch(), totals.refetch()])
  );

  const [declining, setDeclining] = useState<string | null>(null);

  const items = (assignedQuery.data ?? []).filter((a) => a.shift != null);
  const daConfermare = items.filter((a) => a.status === "assigned");
  const inProgramma = items.filter((a) => a.status !== "assigned");

  function onConfirm(id: string) {
    respond.mutate(
      { id, status: "confirmed" },
      {
        onSuccess: () => toast.show("Presenza confermata"),
        onError: () => toast.show("Operazione non riuscita. Riprova.", "error"),
      }
    );
  }

  function doDecline() {
    if (!declining) return;
    respond.mutate(
      { id: declining, status: "declined" },
      {
        onSuccess: () => {
          setDeclining(null);
          toast.show("Turno rifiutato");
        },
        onError: () => {
          setDeclining(null);
          toast.show("Operazione non riuscita. Riprova.", "error");
        },
      }
    );
  }

  const openShift = (id: string) => router.push(`/(waiter)/shift/${id}`);

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 96,
          gap: 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            tintColor="#EAB54C"
            refreshing={pull.refreshing}
            onRefresh={pull.onRefresh}
          />
        }
      >
        <View>
          <Mono gold>
            {daConfermare.length > 0
              ? `${daConfermare.length} da confermare`
              : `${items.length} in programma`}
          </Mono>
          <Display className="mt-1 text-4xl">I miei turni</Display>
        </View>

        <Card
          className="rounded-3xl border-border-2 p-4"
          onPress={() => router.push("/(waiter)/storico")}
        >
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-2">
              <Icon name="clock" size={18} color="#EAB54C" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-sans-bold text-t1">
                Le mie ore
              </Text>
              <Text className="text-xs text-t3">
                {totals.count} turni svolti · {formatHours(totals.totalHours)}
              </Text>
            </View>
            <Icon name="chevR" size={18} color="#8c857a" />
          </View>
        </Card>

        {assignedQuery.isLoading ? (
          <ActivityIndicator color="#EAB54C" style={{ marginTop: 40 }} />
        ) : assignedQuery.isError ? (
          <QueryError onRetry={() => assignedQuery.refetch()} />
        ) : items.length === 0 ? (
          <View className="flex-1 justify-center">
            <EmptyState
              title="Nessun turno in programma"
              subtitle="Quando un locale ti assegna un turno lo trovi qui. In «Le mie ore» c'è lo storico."
            />
          </View>
        ) : (
          <>
            {daConfermare.length > 0 ? (
              <View>
                <SectionHeader title="Da confermare" />
                <View className="gap-3">
                  {daConfermare.map((a) => (
                    <View key={a.id} className="gap-2">
                      <MyShiftCard
                        shift={a.shift!}
                        status={a.status}
                        onPress={() => openShift(a.shift!.id)}
                      />
                      <GoldButton
                        label={
                          respond.isPending
                            ? "Attendere…"
                            : "Conferma presenza"
                        }
                        disabled={respond.isPending}
                        onPress={() => onConfirm(a.id)}
                      />
                      <GhostButton
                        label="Non posso"
                        disabled={respond.isPending}
                        onPress={() => setDeclining(a.id)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {inProgramma.length > 0 ? (
              <View>
                <SectionHeader title="In programma" />
                <View className="gap-3">
                  {inProgramma.map((a) => (
                    <MyShiftCard
                      key={a.id}
                      shift={a.shift!}
                      status={a.status}
                      onPress={() => openShift(a.shift!.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={declining != null}
        title="Rifiutare il turno?"
        message="Il locale verrà avvisato."
        confirmLabel="Rifiuta"
        destructive
        pending={respond.isPending}
        onConfirm={doDecline}
        onCancel={() => setDeclining(null)}
      />
    </>
  );
}
