import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, View } from "@/tw";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Display } from "@/components/ui/Display";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mono } from "@/components/ui/Mono";
import { NavRow } from "@/components/ui/NavRow";
import { QueryError } from "@/components/ui/QueryError";
import { WeekCalendar } from "@/components/ui/WeekCalendar";
import {
  type AgendaItem,
  type AgendaSection,
  daysWithShifts,
  groupAssignmentsByDay,
  withShift,
} from "@/features/assignments/agenda";
import {
  useMyAssignedUpcoming,
  useRespondToAssignment,
} from "@/features/assignments/hooks";
import { useMyWorkHistoryTotals } from "@/features/assignments/history";
import { MyShiftCard } from "@/features/assignments/MyShiftCard";
import { useAuth } from "@/lib/auth";
import { formatDayLabel, formatHours, todayString } from "@/lib/format";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useToast } from "@/providers/Toast";

/** Quanto ignorare il ritorno dello scorrimento dopo aver scelto un giorno. */
const SYNC_SETTLE_MS = 400;

const VIEWABILITY = { itemVisiblePercentThreshold: 20 };

/**
 * L'agenda del professionista: i turni che i locali gli hanno assegnato,
 * raggruppati per giorno sotto un calendario.
 *
 * **Scegliere un giorno fa ripartire l'agenda da lì**, non la fa scorrere fino
 * a lì. Lo scorrimento era la prima versione e non funzionava:
 * `SectionList.scrollToLocation` calcola un offset nullo quando le celle non
 * sono ancora state disposte, e fallisce *in silenzio* — nessun
 * `onScrollToIndexFailed`, nessun movimento. Misurare le sezioni a mano non è
 * un'alternativa: ogni cella sta in un contenitore suo, quindi `onLayout`
 * restituisce 0 per tutte. Ripartire dal giorno scelto non dipende da nessuna
 * misura, e per giunta risponde meglio alla domanda che si fa toccando una
 * data: «cosa faccio quel giorno».
 *
 * Il calendario resta comunque agganciato allo scorrimento: scorrendo, il
 * giorno evidenziato segue la lista.
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

  const today = todayString();
  const [declining, setDeclining] = useState<string | null>(null);
  /** Da dove parte l'agenda: lo sposta solo una scelta sul calendario. */
  const [anchorDay, setAnchorDay] = useState(today);
  /** Il giorno evidenziato: lo sposta anche lo scorrimento della lista. */
  const [visibleDay, setVisibleDay] = useState(today);
  const [expanded, setExpanded] = useState(false);

  const listRef = useRef<SectionList<AgendaItem, AgendaSection>>(null);
  // Alza la mano subito dopo una scelta: la lista si sta ancora ricomponendo e
  // il ritorno dello scorrimento riscriverebbe il giorno appena scelto.
  const syncing = useRef(false);

  const items = useMemo(
    () => withShift(assignedQuery.data ?? []),
    [assignedQuery.data]
  );
  const allSections = useMemo(() => groupAssignmentsByDay(items), [items]);
  // I pallini del calendario restano su **tutti** i giorni con turni, anche
  // quelli prima dell'ancora: il calendario è la mappa, non la vista corrente.
  const marked = useMemo(() => daysWithShifts(items), [items]);
  const sections = useMemo(
    () => allSections.filter((s) => (s.date ?? "") >= anchorDay),
    [allSections, anchorDay]
  );
  const daConfermare = items.filter((a) => a.status === "assigned");

  function goToDay(date: string, browsing?: boolean) {
    syncing.current = true;
    setVisibleDay(date);
    setAnchorDay(date);
    // Scegliere un giorno richiude il mese: con la griglia aperta l'agenda ha
    // due righe di spazio e il cambio non si vedrebbe. Sfogliare i mesi invece
    // la lascia aperta — si sta ancora guardando.
    if (expanded && !browsing) setExpanded(false);
    // La lista riparte dal giorno scelto, quindi va riportata in cima:
    // altrimenti si resterebbe all'altezza di scorrimento di prima.
    listRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated: false });
    setTimeout(() => {
      syncing.current = false;
    }, SYNC_SETTLE_MS);
  }

  // Identità stabile: `VirtualizedList` rifiuta un `onViewableItemsChanged`
  // che cambia fra un render e l'altro.
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (syncing.current) return;
      const first = viewableItems.find((v) => v.section != null);
      const date = (first?.section as AgendaSection | undefined)?.date;
      if (date) setVisibleDay((prev) => (prev === date ? prev : date));
    },
    []
  );

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

  const away = anchorDay !== today;

  return (
    <>
      <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 12 }}>
        <View className="px-5">
          <View className="flex-row items-end justify-between gap-3">
            <View className="flex-1">
              <Mono gold>
                {daConfermare.length > 0
                  ? `${daConfermare.length} da confermare`
                  : `${items.length} in programma`}
              </Mono>
              <Display className="mt-1 text-3xl">I miei turni</Display>
            </View>
            {/* Il ritorno: una volta spostata l'ancora, "oggi" non è più a
                portata di scorrimento e va rimesso a portata di tocco. */}
            {away ? (
              <Pressable
                onPress={() => goToDay(today)}
                className="rounded-full border border-border-gold bg-bg-2 px-3 py-1.5"
                accessibilityRole="button"
              >
                <Mono gold>Oggi</Mono>
              </Pressable>
            ) : null}
          </View>
          <WeekCalendar
            className="mt-4"
            selected={visibleDay}
            onSelect={goToDay}
            marked={marked}
            expanded={expanded}
            onToggleExpand={() => setExpanded((v) => !v)}
          />
        </View>

        {assignedQuery.isLoading ? (
          <ActivityIndicator color="#EAB54C" style={{ marginTop: 40 }} />
        ) : assignedQuery.isError ? (
          <QueryError onRetry={() => assignedQuery.refetch()} />
        ) : (
          <SectionList
            ref={listRef}
            style={{ flex: 1 }}
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: insets.bottom + 96,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                tintColor="#EAB54C"
                refreshing={pull.refreshing}
                onRefresh={pull.onRefresh}
              />
            }
            viewabilityConfig={VIEWABILITY}
            onViewableItemsChanged={onViewableItemsChanged}
            ListHeaderComponent={
              daConfermare.length > 0 ? (
                <AlertBanner
                  className="mb-4"
                  icon="alert"
                  title={
                    daConfermare.length === 1
                      ? "1 turno da confermare"
                      : `${daConfermare.length} turni da confermare`
                  }
                  subtitle="Il locale sta aspettando la tua risposta"
                  onPress={() => goToDay(daConfermare[0].shift.date)}
                />
              ) : null
            }
            renderSectionHeader={({ section }) => (
              <View className="bg-bg-0 pb-2 pt-3">
                <Mono gold={section.date === today}>{section.title}</Mono>
              </View>
            )}
            renderItem={({ item }) => (
              <View className="pb-3">
                <MyShiftCard
                  shift={item.shift}
                  status={item.status}
                  role={item.role?.name}
                  onPress={() => router.push(`/(waiter)/shift/${item.shift.id}`)}
                  onConfirm={() => onConfirm(item.id)}
                  onDecline={() => setDeclining(item.id)}
                  pending={
                    respond.isPending && respond.variables?.id === item.id
                  }
                />
              </View>
            )}
            ListEmptyComponent={
              <View className="flex-1 justify-center">
                <EmptyState
                  title={
                    away
                      ? "Nessun turno da qui in poi"
                      : "Nessun turno in programma"
                  }
                  subtitle={
                    away
                      ? `Dal ${formatDayLabel(anchorDay).toLowerCase()} non hai turni assegnati. Tocca «Oggi» per tornare ai prossimi.`
                      : "Quando un locale ti assegna un turno lo trovi qui. In «Le mie ore» c'è lo storico."
                  }
                />
              </View>
            }
            ListFooterComponent={
              <NavRow
                className="mt-4"
                icon="clock"
                title="Le mie ore"
                subtitle={`${totals.count} turni svolti · ${formatHours(totals.totalHours)}`}
                onPress={() => router.push("/(waiter)/storico")}
              />
            }
          />
        )}
      </View>

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
