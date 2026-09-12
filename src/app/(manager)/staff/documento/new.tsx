import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { DocumentFormView } from "@/features/documents/DocumentFormView";
import { useCreateStaffDocument } from "@/features/documents/hooks";

/**
 * Aggiunta di un documento alla scheda di un dipendente, lato locale. È la
 * ragione per cui i documenti stanno sulla scheda e non sulla persona: metà
 * dell'organico è fatto di schede senza account, e quelle persone non possono
 * caricarsi niente da sole.
 */
export default function NewStaffDocumentScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const create = useCreateStaffDocument(staffId);

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-6">
        <ScreenHeader eyebrow="Documenti" title="Nuovo documento" />
      </View>
      <DocumentFormView
        requireFile
        submitLabel="Aggiungi documento"
        pending={create.isPending}
        onSubmit={({ name, expires_at, file }) => {
          if (!file) return;
          create.mutate(
            { uploadedBy: session!.user.id, meta: { name, expires_at }, file },
            {
              onSuccess: () => {
                toast.show("Documento aggiunto");
                router.back();
              },
              onError: (e) =>
                toast.show(
                  e instanceof Error
                    ? e.message
                    : "Impossibile caricare il documento.",
                  "error"
                ),
            }
          );
        }}
      />
    </View>
  );
}
