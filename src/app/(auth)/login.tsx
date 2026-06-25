import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { LogoBadge } from "@/components/ui/LogoBadge";
import { Display } from "@/components/ui/Display";
import { GoldButton } from "@/components/ui/GoldButton";
import { ControlledInput } from "@/components/form/ControlledInput";
import { useAuth, authErrorMessage } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { supabase } from "@/lib/supabase";
import { loginSchema, type LoginForm } from "@/features/auth/schema";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (loading) return;
    setApiError(null);
    setLoading(true);
    const res = await signIn(values.email.trim(), values.password);
    setLoading(false);
    if (res.error) setApiError(authErrorMessage(res.error));
    // in caso di successo la navigazione è gestita dai guard nel root layout
  });

  async function onForgot() {
    const email = getValues("email").trim();
    if (!email.includes("@")) {
      toast.show("Inserisci la tua email per recuperare la password.", "error");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.show(authErrorMessage(error.message), "error");
    else toast.show("Email di recupero inviata. Controlla la posta.");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-0"
        contentContainerClassName="flex-grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">
          <LogoBadge size={72} />
          <Display className="mt-5 text-[26px]">Bentornato</Display>
          <Text className="mt-1.5 font-sans text-sm text-t3">
            Accedi al tuo account
          </Text>
        </View>

        <View className="mt-9 gap-4">
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
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable className="self-end" onPress={onForgot}>
            <Text className="font-sans text-xs text-gold">
              Password dimenticata?
            </Text>
          </Pressable>

          {apiError ? (
            <Text className="font-sans text-sm text-error">{apiError}</Text>
          ) : null}

          <GoldButton
            className="mt-2"
            size="lg"
            label={loading ? "Accesso…" : "Accedi"}
            disabled={loading}
            onPress={onSubmit}
          />
        </View>

        <Pressable
          className="mt-8 flex-row justify-center gap-1"
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text className="font-sans text-sm text-t2">Non hai un account?</Text>
          <Text className="font-sans-semibold text-sm text-gold">Registrati</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
