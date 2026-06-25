import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { LogoBadge } from "@/components/ui/LogoBadge";
import { Display } from "@/components/ui/Display";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { useAuth, authErrorMessage } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (loading) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) setError(authErrorMessage(res.error));
    // in caso di successo la navigazione è gestita dai guard nel root layout
  }

  async function onForgot() {
    setError(null);
    setInfo(null);
    if (!email.includes("@")) {
      setError("Inserisci la tua email per recuperare la password.");
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim()
    );
    if (err) setError(authErrorMessage(err));
    else setInfo("Email di recupero inviata. Controlla la posta.");
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
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nome@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable className="self-end" onPress={onForgot}>
            <Text className="font-sans text-xs text-gold">
              Password dimenticata?
            </Text>
          </Pressable>

          {error ? (
            <Text className="font-sans text-sm text-error">{error}</Text>
          ) : null}
          {info ? (
            <Text className="font-sans text-sm text-success">{info}</Text>
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
          <Text className="font-sans-semibold text-sm text-gold">
            Registrati
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
