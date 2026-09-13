import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { ControlledInput } from "@/components/form/ControlledInput";
import { AvatarPickerField } from "@/components/ui/AvatarPickerField";
import { GoldButton } from "@/components/ui/GoldButton";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  deleteAvatarByUrl,
  uploadAvatar,
} from "@/features/account/api";
import { pickAvatar } from "@/features/account/avatarPicker";
import { useAuth } from "@/lib/auth";
import { userErrorMessage } from "@/lib/errors";
import { useToast } from "@/providers/Toast";
import {
  useMyVenue,
  useSaveVenue,
  useUpdateVenueLogo,
} from "@/features/venues/hooks";
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
  const saveLogo = useUpdateVenueLogo(userId);
  const [logoBusy, setLogoBusy] = useState(false);

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

  /**
   * Stesso ordine della foto profilo: prima il locale punta al file nuovo, poi
   * si cancella il vecchio. Al contrario, un errore a metà lascerebbe il
   * locale a puntare a un file che non c'è più.
   *
   * Il file va sotto la cartella dell'**utente** e non del locale: la policy
   * del bucket `avatars` accetta scritture solo in `<auth.uid()>/…`, e il
   * titolare è comunque l'unico che può caricarlo.
   */
  async function onLogo() {
    if (logoBusy) return;
    if (!venue) {
      toast.show("Salva prima il nome del locale.", "error");
      return;
    }
    const previous = venue.logo_url ?? null;
    try {
      const picked = await pickAvatar();
      if (!picked) return; // annullato
      setLogoBusy(true);
      const url = await uploadAvatar(userId, picked.bytes, {
        contentType: picked.contentType,
      });
      await saveLogo.mutateAsync({ venueId: venue.id, logoUrl: url });
      await deleteAvatarByUrl(previous);
      toast.show("Logo aggiornato");
    } catch (e) {
      toast.show(userErrorMessage(e, "Caricamento non riuscito"), "error");
    } finally {
      setLogoBusy(false);
    }
  }

  async function onRemoveLogo() {
    const previous = venue?.logo_url ?? null;
    if (!venue || !previous || logoBusy) return;
    setLogoBusy(true);
    try {
      await saveLogo.mutateAsync({ venueId: venue.id, logoUrl: null });
      await deleteAvatarByUrl(previous);
      toast.show("Logo rimosso");
    } catch (e) {
      toast.show(userErrorMessage(e, "Operazione non riuscita"), "error");
    } finally {
      setLogoBusy(false);
    }
  }

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
          Queste informazioni saranno visibili ai professionisti sui tuoi turni.
        </Text>

        {/* Il logo si può caricare solo su un locale già creato: prima non c'è
            una riga su cui scriverlo. Chi sta compilando il modulo per la prima
            volta lo trova qui appena salva il nome. */}
        {venue ? (
          <AvatarPickerField
            uri={venue.logo_url}
            name={venue.name}
            busy={logoBusy}
            onPick={onLogo}
            onRemove={onRemoveLogo}
            addLabel="Aggiungi logo"
            changeLabel="Cambia logo"
          />
        ) : null}

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
          // La colonna resta `cuisine_type` per non migrare il DB: l'etichetta
          // è neutra perché un hotel o un'agenzia eventi non ha una "cucina".
          label="Tipo di attività"
          placeholder="Ristorante, hotel, catering, discoteca…"
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
