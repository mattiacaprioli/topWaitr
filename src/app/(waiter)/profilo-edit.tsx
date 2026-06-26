import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { GoldButton } from "@/components/ui/GoldButton";
import { Icon } from "@/components/ui/Icon";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ControlledChoiceChips } from "@/components/form/ControlledChoiceChips";
import { ControlledInput } from "@/components/form/ControlledInput";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import {
  useMyWaiterProfile,
  useSaveWaiterProfile,
} from "@/features/waiterProfile/hooks";
import { PRIMARY_ROLE_OPTIONS } from "@/features/waiterProfile/api";
import {
  waiterProfileSchema,
  type WaiterProfileForm,
} from "@/features/waiterProfile/schema";

const BIO_MAX = 180;

export default function WaiterProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session, refreshProfile } = useAuth();
  const userId = session!.user.id;

  const profileQuery = useMyWaiterProfile(userId);
  const save = useSaveWaiterProfile(userId);

  const { control, handleSubmit, reset } = useForm<WaiterProfileForm>({
    resolver: zodResolver(waiterProfileSchema),
    defaultValues: {
      full_name: "",
      city: "",
      bio: "",
      primary_role: "",
      languages: "",
      specializations: "",
      experience: "",
    },
  });

  const watchedName = useWatch({ control, name: "full_name" });
  const bioLen = (useWatch({ control, name: "bio" }) ?? "").length;

  const data = profileQuery.data;
  useEffect(() => {
    if (!data) return;
    const wp = data.waiter_profile;
    reset({
      full_name: data.full_name ?? "",
      city: data.city ?? "",
      bio: data.bio ?? "",
      primary_role: wp?.primary_role ?? "",
      languages: wp?.languages ?? "",
      specializations: wp?.specializations ?? "",
      experience: wp?.experience ?? "",
    });
  }, [data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        full_name: values.full_name,
        city: values.city || null,
        bio: values.bio || null,
        primary_role: values.primary_role || null,
        languages: values.languages || null,
        specializations: values.specializations || null,
        experience: values.experience || null,
      });
      await refreshProfile();
      toast.show("Profilo salvato");
      router.back();
    } catch {
      toast.show("Impossibile salvare. Riprova.", "error");
    }
  });

  const onPhoto = () =>
    toast.show("Caricamento foto presto disponibile");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
        <View className="px-5 pb-3">
          <ScreenHeader
            icon="close"
            eyebrow="Profilo"
            title="Modifica profilo"
            titleClassName="text-2xl"
            right={
              <GoldButton
                size="sm"
                label="Salva"
                onPress={onSubmit}
                disabled={save.isPending || profileQuery.isLoading}
              />
            }
          />
        </View>

        {profileQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#EAB54C" />
          </View>
        ) : profileQuery.isError ? (
          <View className="flex-1 justify-center px-6">
            <QueryError onRetry={() => profileQuery.refetch()} />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingTop: 8,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 24,
              gap: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center gap-2">
              <View
                style={{
                  borderWidth: 2,
                  borderColor: "rgba(234,181,76,0.5)",
                  borderRadius: 999,
                  padding: 3,
                }}
              >
                <View>
                  <Avatar name={watchedName || "Cameriere"} size={96} />
                  <Pressable
                    onPress={onPhoto}
                    className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-bg-0 bg-bg-2"
                  >
                    <Icon name="camera" size={16} color="#EAB54C" />
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={onPhoto} hitSlop={6}>
                <Text className="text-sm font-sans-semibold text-gold">
                  Cambia foto
                </Text>
              </Pressable>
            </View>

            <View className="gap-4 rounded-3xl border border-border-2 bg-bg-card p-5">
              <ControlledInput
                control={control}
                name="full_name"
                label="Nome e cognome"
                placeholder="Marco Rossi"
              />
              <ControlledChoiceChips
                control={control}
                name="primary_role"
                label="Ruolo principale"
                options={PRIMARY_ROLE_OPTIONS}
              />
              <ControlledInput
                control={control}
                name="city"
                label="Città"
                placeholder="Milano"
              />
            </View>

            <View className="gap-4 rounded-3xl border border-border-2 bg-bg-card p-5">
              <View>
                <ControlledInput
                  control={control}
                  name="bio"
                  label="Bio · come ti presenti"
                  placeholder="Raccontati ai ristoratori…"
                  multiline
                  numberOfLines={4}
                  maxLength={BIO_MAX}
                  className="h-28"
                  textAlignVertical="top"
                />
                <Text className="mt-1 self-end text-xs text-t3">
                  {bioLen}/{BIO_MAX}
                </Text>
              </View>
              <ControlledInput
                control={control}
                name="languages"
                label="Lingue parlate"
                placeholder="IT · EN · FR · ES (base)"
              />
              <ControlledInput
                control={control}
                name="specializations"
                label="Specializzazioni"
                placeholder="Vini naturali, Cocktail classici"
              />
              <ControlledInput
                control={control}
                name="experience"
                label="Esperienza"
                placeholder="6 anni · Sala alta cucina"
              />
            </View>

            <View className="flex-row gap-3 rounded-3xl border border-border-2 bg-bg-card p-5">
              <Icon name="shield" size={20} color="#4FC97D" />
              <Text className="flex-1 text-sm leading-5 text-t3">
                Recensioni, badge e documenti sono verificati e non modificabili:
                è ciò che rende la tua reputazione affidabile.
              </Text>
            </View>

            <GoldButton
              label={save.isPending ? "Salvataggio…" : "Salva modifiche"}
              disabled={save.isPending}
              onPress={onSubmit}
            />
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
