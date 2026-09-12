import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mono } from "@/components/ui/Mono";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useMyEmployers } from "@/features/staff/hooks";
import { DocumentsSection } from "@/features/documents/DocumentsSection";

/**
 * I documenti del professionista, **un elenco per locale**.
 *
 * Non è una cartella personale: un documento sta sulla scheda che il locale ha
 * di te, ed è l'unico modo in cui il locale può tenerne una anche per chi l'app
 * non ce l'ha. La conseguenza — che va detta in pagina, non scoperta — è che
 * chi lavora in due locali carica due volte, e che lasciando un locale i
 * documenti di quella scheda se ne vanno con lei.
 */
export default function WaiterDocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const query = useMyEmployers(session!.user.id);
  const employers = query.data ?? [];
  const pull = usePullToRefresh(query.refetch);

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 48,
        gap: 24,
      }}
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={pull.refreshing}
          onRefresh={pull.onRefresh}
        />
      }
    >
      <ScreenHeader eyebrow="Profilo · Privato" title="I tuoi documenti" />

      <Text className="-mt-4 text-[13px] leading-5 text-t3">
        HACCP, contratti, attestati. Li vede solo il locale a cui li carichi, e
        li puoi aggiornare quando vuoi.
      </Text>

      {query.isLoading ? (
        <ActivityIndicator color="#EAB54C" className="mt-10" />
      ) : query.isError ? (
        <QueryError onRetry={() => query.refetch()} />
      ) : employers.length === 0 ? (
        <EmptyState
          title="Non fai ancora parte di un locale"
          subtitle="I documenti si caricano sulla scheda che il locale ha di te: appena entri in un organico, li trovi qui."
        />
      ) : (
        employers.map((employer) => (
          <View key={employer.id} className="gap-2">
            <Mono gold>{employer.venue?.name ?? "Locale"}</Mono>
            <DocumentsSection
              staffMemberId={employer.id}
              title="Documenti"
              onAdd={() =>
                router.push({
                  pathname: "/(waiter)/documento/new",
                  params: { staffId: employer.id },
                })
              }
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}
