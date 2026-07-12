import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { useCreateExperience } from "@/features/experiences/hooks";
import { ExperienceFormView } from "@/features/experiences/ExperienceFormView";
import {
  emptyExperienceForm,
  formToInput,
  type ExperienceForm,
} from "@/features/experiences/schema";

export default function NewExperienceScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session!.user.id;
  const create = useCreateExperience(userId);

  const onSubmit = (values: ExperienceForm) => {
    create.mutate(formToInput(values), {
      onSuccess: () => {
        toast.show("Esperienza aggiunta");
        router.back();
      },
      onError: () => toast.show("Impossibile salvare. Riprova.", "error"),
    });
  };

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-6">
        <ScreenHeader eyebrow="Esperienza" title="Nuova esperienza" />
      </View>
      <ExperienceFormView
        defaultValues={emptyExperienceForm}
        submitLabel="Aggiungi esperienza"
        pendingLabel="Salvataggio…"
        pending={create.isPending}
        onSubmit={onSubmit}
      />
    </View>
  );
}
