import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { ControlledInput } from "@/components/form/ControlledInput";
import { GoldButton } from "@/components/ui/GoldButton";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { useMyVenue, useSaveVenue } from "@/features/venues/hooks";
import { venueSchema, type VenueForm } from "@/features/venues/schema";

export default function VenueScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const userId = session!.user.id;

  const venueQuery = useMyVenue(userId);
  const venue = venueQuery.data ?? null;
  const save = useSaveVenue(userId);

  const { control, handleSubmit, reset } = useForm<VenueForm>({
    resolver: zodResolver(venueSchema),
    defaultValues: { name: "", city: "", address: "", cuisine_type: "", description: "" },
  });

  useEffect(() => {
    if (venue) {
      reset({
        name: venue.name,
        city: venue.city ?? "",
        address: venue.address ?? "",
        cuisine_type: venue.cuisine_type ?? "",
        description: venue.description ?? "",
      });
    }
  }, [venue, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        input: {
          name: values.name,
          city: values.city || null,
          address: values.address || null,
          cuisine_type: values.cuisine_type || null,
          description: values.description || null,
        },
        venueId: venue?.id,
      });
      toast.show("Locale salvato");
      router.back();
    } catch {
      toast.show("Impossibile salvare. Riprova.", "error");
    }
  });

  if (venueQuery.isLoading) return <View className="flex-1 bg-bg-0" />;

  if (venueQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-bg-0 px-6">
        <QueryError onRetry={() => venueQuery.refetch()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
    >
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 48,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader eyebrow="Locale" title="Il tuo locale" />

        <Text className="text-base text-t2">
          Queste informazioni saranno visibili ai camerieri sui tuoi turni.
        </Text>

        <ControlledInput
          control={control}
          name="name"
          label="Nome del locale"
          placeholder="Trattoria da Mario"
        />
        <ControlledInput
          control={control}
          name="city"
          label="Città"
          placeholder="Milano"
        />
        <ControlledInput
          control={control}
          name="address"
          label="Indirizzo"
          placeholder="Via Roma 1"
        />
        <ControlledInput
          control={control}
          name="cuisine_type"
          label="Tipo di cucina"
          placeholder="Italiana, pizzeria…"
        />
        <ControlledInput
          control={control}
          name="description"
          label="Descrizione"
          placeholder="Racconta il tuo locale"
          multiline
          numberOfLines={4}
          className="h-28"
          textAlignVertical="top"
        />

        <GoldButton
          className="mt-2"
          label={save.isPending ? "Salvataggio…" : "Salva locale"}
          disabled={save.isPending}
          onPress={onSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
