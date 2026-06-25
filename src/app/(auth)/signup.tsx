import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { ShimmerText } from "@/components/ui/ShimmerText";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { useAuth, authErrorMessage } from "@/lib/auth";
import type { Enums } from "@/types/database";

type Role = Enums<"user_role">;

const ROLES: { value: Role; title: string; desc: string }[] = [
  { value: "waiter", title: "Cameriere", desc: "Cerco turni di lavoro" },
  { value: "manager", title: "Ristoratore", desc: "Pubblico turni" },
];

export default function Signup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("waiter");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (loading) return;
    setError(null);
    setInfo(null);
    if (!fullName.trim()) {
      setError("Inserisci il tuo nome.");
      return;
    }
    setLoading(true);
    const res = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role,
    });
    setLoading(false);
    if (res.error) {
      setError(authErrorMessage(res.error));
      return;
    }
    if (res.needsConfirmation) {
      setInfo("Ti abbiamo inviato un'email di conferma. Controlla la posta.");
    }
    // in caso di sessione attiva, i guard nel root layout reindirizzano
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
          Crea il tuo account
        </Text>

        <View className="mt-8 flex-row gap-3">
          {ROLES.map((r) => {
            const active = role === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                className={cn(
                  "flex-1 rounded-2xl border p-4",
                  active
                    ? "border-border-gold bg-bg-3"
                    : "border-border bg-bg-2"
                )}
              >
                <Text
                  className={cn(
                    "text-base font-bold",
                    active ? "text-gold" : "text-t1"
                  )}
                >
                  {r.title}
                </Text>
                <Text className="mt-1 text-xs text-t2">{r.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6 gap-4">
          <Input
            label="Nome e cognome"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Mario Rossi"
            autoCapitalize="words"
            autoComplete="name"
          />
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
            placeholder="Almeno 6 caratteri"
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text className="text-sm text-error">{error}</Text> : null}
          {info ? <Text className="text-sm text-success">{info}</Text> : null}

          <GoldButton
            className="mt-2"
            label={loading ? "Creazione…" : "Crea account"}
            disabled={loading}
            onPress={onSubmit}
          />
        </View>

        <Pressable
          className="mt-8 flex-row justify-center gap-1"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-sm text-t2">Hai già un account?</Text>
          <Text className="text-sm font-semibold text-gold">Accedi</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
