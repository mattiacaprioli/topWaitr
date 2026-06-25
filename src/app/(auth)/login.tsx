import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { ShimmerText } from "@/components/ui/ShimmerText";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { useAuth, authErrorMessage } from "@/lib/auth";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (loading) return;
    setError(null);
    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) setError(authErrorMessage(res.error));
    // in caso di successo la navigazione è gestita dai guard nel root layout
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-1"
        contentContainerClassName="flex-grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">
          <ShimmerText fontSize={40}>topWaitr</ShimmerText>
        </View>
        <Text className="mt-2 text-center text-base text-t2">
          Accedi al tuo account
        </Text>

        <View className="mt-10 gap-4">
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

          {error ? (
            <Text className="text-sm text-error">{error}</Text>
          ) : null}

          <GoldButton
            className="mt-2"
            label={loading ? "Accesso…" : "Accedi"}
            disabled={loading}
            onPress={onSubmit}
          />
        </View>

        <Pressable
          className="mt-8 flex-row justify-center gap-1"
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text className="text-sm text-t2">Non hai un account?</Text>
          <Text className="text-sm font-semibold text-gold">Registrati</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
