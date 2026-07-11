import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Display } from "@/components/ui/Display";
import { Mono } from "@/components/ui/Mono";
import { Icon } from "@/components/ui/Icon";
import { GoldButton } from "@/components/ui/GoldButton";
import { ControlledInput } from "@/components/form/ControlledInput";
import { useAuth, authErrorMessage } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { signupSchema, type SignupForm } from "@/features/auth/schema";
import { PasswordChecklist } from "@/features/auth/PasswordChecklist";
import type { Enums } from "@/types/database";

type Role = Enums<"user_role">;

export default function SignupAccount() {
  const { signUp } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: Role = params.role === "manager" ? "manager" : "waiter";
  const roleLabel = role === "manager" ? "Ristoratore" : "Professionista";

  const [apiError, setApiError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = handleSubmit(async (values) => {
    if (loading) return;
    setApiError(null);
    setInfo(null);
    setLoading(true);
    const res = await signUp({
      email: values.email.trim(),
      password: values.password,
      fullName: values.fullName.trim(),
      role,
    });
    setLoading(false);
    if (res.error) {
      setApiError(authErrorMessage(res.error));
      return;
    }
    if (res.needsConfirmation) {
      setInfo("Ti abbiamo inviato un'email di conferma. Controlla la posta.");
      toast.show("Controlla la posta per confermare.");
    }
    // in caso di sessione attiva, i guard nel root layout reindirizzano
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerClassName="flex-grow px-6 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: insets.top + 8 }} />
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-1"
        >
          <Icon name="chevL" size={18} color="#C2BBB0" />
        </Pressable>

        <Mono gold className="mt-6">
          {roleLabel}
        </Mono>
        <Display className="mt-2 text-[28px]">Crea il tuo account</Display>
        <Text className="mt-2 font-sans text-[13.5px] text-t3">
          Bastano pochi dati per iniziare.
        </Text>

        <View className="mt-7 gap-4">
          <ControlledInput
            control={control}
            name="fullName"
            label="Nome e cognome"
            placeholder="Mario Rossi"
            autoCapitalize="words"
            autoComplete="name"
          />
          <ControlledInput
            control={control}
            name="email"
            label="Email"
            placeholder="nome@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
          />
          <ControlledInput
            control={control}
            name="password"
            label="Password"
            placeholder="Crea una password sicura"
            secureTextEntry
            autoCapitalize="none"
          />
          <PasswordChecklist value={password} />

          {apiError ? (
            <Text className="font-sans text-sm text-error">{apiError}</Text>
          ) : null}
          {info ? (
            <Text className="font-sans text-sm text-success">{info}</Text>
          ) : null}

          <GoldButton
            className="mt-2"
            size="lg"
            label={loading ? "Creazione…" : "Crea account"}
            disabled={loading}
            onPress={onSubmit}
          />
        </View>

        <Pressable
          className="mt-8 flex-row justify-center gap-1"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="font-sans text-sm text-t2">Hai già un account?</Text>
          <Text className="font-sans-semibold text-sm text-gold">Accedi</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
