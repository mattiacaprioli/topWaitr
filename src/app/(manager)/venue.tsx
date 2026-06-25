import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, Text, View } from "@/tw";
import { Input } from "@/components/ui/Input";
import { GoldButton } from "@/components/ui/GoldButton";
import { useAuth } from "@/lib/auth";
import { getMyVenue, saveVenue, type Venue } from "@/lib/manager";

export default function VenueScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const userId = session!.user.id;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyVenue(userId).then((v) => {
      if (v) {
        setVenue(v);
        setName(v.name);
        setCity(v.city ?? "");
        setAddress(v.address ?? "");
        setCuisine(v.cuisine_type ?? "");
        setDescription(v.description ?? "");
      }
      setLoading(false);
    });
  }, [userId]);

  async function onSave() {
    if (saving) return;
    if (!name.trim()) {
      setError("Inserisci il nome del locale.");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: err } = await saveVenue(
      userId,
      {
        name: name.trim(),
        city: city.trim() || null,
        address: address.trim() || null,
        cuisine_type: cuisine.trim() || null,
        description: description.trim() || null,
      },
      venue?.id
    );
    setSaving(false);
    if (err) {
      setError("Impossibile salvare. Riprova.");
      return;
    }
    router.back();
  }

  if (loading) return <View className="flex-1 bg-bg-1" />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-1"
        contentContainerClassName="p-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-base text-t2">
          Queste informazioni saranno visibili ai camerieri sui tuoi turni.
        </Text>

        <Input
          label="Nome del locale"
          value={name}
          onChangeText={setName}
          placeholder="Trattoria da Mario"
        />
        <Input
          label="Città"
          value={city}
          onChangeText={setCity}
          placeholder="Milano"
        />
        <Input
          label="Indirizzo"
          value={address}
          onChangeText={setAddress}
          placeholder="Via Roma 1"
        />
        <Input
          label="Tipo di cucina"
          value={cuisine}
          onChangeText={setCuisine}
          placeholder="Italiana, pizzeria…"
        />
        <Input
          label="Descrizione"
          value={description}
          onChangeText={setDescription}
          placeholder="Racconta il tuo locale"
          multiline
          numberOfLines={4}
          className="h-28"
          textAlignVertical="top"
        />

        {error ? <Text className="text-sm text-error">{error}</Text> : null}

        <GoldButton
          className="mt-2"
          label={saving ? "Salvataggio…" : "Salva locale"}
          disabled={saving}
          onPress={onSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
