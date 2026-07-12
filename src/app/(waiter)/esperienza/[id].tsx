import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import {
  useDeleteExperience,
  useExperience,
  useUpdateExperience,
} from "@/features/experiences/hooks";
import { ExperienceFormView } from "@/features/experiences/ExperienceFormView";
import {
  experienceToForm,
  formToInput,
  type ExperienceForm,
} from "@/features/experiences/schema";

export default function EditExperienceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session!.user.id;

  const expQuery = useExperience(id);
  const exp = expQuery.data ?? null;
  const update = useUpdateExperience(id, userId);
  const remove = useDeleteExperience(userId);

  if (expQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-0">
        <ActivityIndicator color="#EAB54C" />
      </View>
    );
  }

  if (expQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-bg-0 px-6">
        <QueryError onRetry={() => expQuery.refetch()} />
      </View>
    );
  }

  if (!exp) {
    return (
      <View className="flex-1 bg-bg-0">
        <EmptyState
          title="Esperienza non trovata"
          subtitle="Questa esperienza non è più disponibile."
        />
      </View>
    );
  }

  const onSubmit = (values: ExperienceForm) => {
    update.mutate(formToInput(values), {
      onSuccess: () => {
        toast.show("Esperienza aggiornata");
        router.back();
      },
      onError: () =>
        toast.show("Impossibile salvare le modifiche. Riprova.", "error"),
    });
  };

  const onDelete = () => {
    remove.mutate(exp.id, {
      onSuccess: () => {
        toast.show("Esperienza eliminata");
        router.back();
      },
      onError: () => toast.show("Impossibile eliminare. Riprova.", "error"),
    });
  };

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-6">
        <ScreenHeader eyebrow="Esperienza" title="Modifica esperienza" />
      </View>
      <ExperienceFormView
        defaultValues={experienceToForm(exp)}
        submitLabel="Salva modifiche"
        pendingLabel="Salvataggio…"
        pending={update.isPending}
        onSubmit={onSubmit}
        onDelete={onDelete}
        deletePending={remove.isPending}
      />
    </View>
  );
}
