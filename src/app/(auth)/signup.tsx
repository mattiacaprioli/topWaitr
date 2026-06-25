import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Display } from "@/components/ui/Display";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { useAuth, authErrorMessage } from "@/lib/auth";
import type { Enums } from "@/types/database";

type Role = Enums<"user_role">;

const ROLES: {
  value: Role;
  icon: IconName;
  title: string;
  sub: string;
  chips: string[];
}[] = [
  {
    value: "waiter",
    icon: "user",
    title: "Sono un professionista",
    sub: "Cameriere, sommelier, chef de rang, runner. Costruisci reputazione e trova turni.",
    chips: ["RECENSIONI", "BADGE", "TURNI"],
  },
  {
    value: "manager",
    icon: "users",
    title: "Gestisco un locale",
    sub: "Ristoratore o manager di sala. Trova talenti verificati e gestisci lo staff.",
    chips: ["TALENTI", "TURNI", "STAFF"],
  },
];

export default function Signup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        className="flex-1 bg-bg-0"
        contentContainerClassName="flex-grow px-6 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: insets.top + 16 }} />
        <Display className="text-[28px]">Crea il tuo account</Display>
        <Text className="mt-2 font-sans text-[13.5px] text-t3">
          Come userai topWaitr? Potrai cambiare in seguito dalle impostazioni.
        </Text>

        <View className="mt-7 gap-3.5">
          {ROLES.map((r) => {
            const active = role === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                className={cn(
                  "gap-3.5 rounded-[22px] border bg-bg-1 p-5",
                  active ? "border-gold" : "border-border"
                )}
              >
                <View className="flex-row items-center gap-3.5">
                  <View className="overflow-hidden rounded-[14px] border border-border-2">
                    <LinearGradient
                      colors={["#362E24", "#1F1A13"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 50,
                        height: 50,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name={r.icon} size={24} color="#EAB54C" />
                    </LinearGradient>
                  </View>
                  <Text className="flex-1 font-sans-semibold text-[17px] text-t1">
                    {r.title}
                  </Text>
                  <Icon
                    name="chevR"
                    size={18}
                    color={active ? "#EAB54C" : "#8C857A"}
                  />
                </View>
                <Text className="font-sans text-[12.5px] leading-5 text-t3">
                  {r.sub}
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {r.chips.map((c) => (
                    <Chip key={c} label={c} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-7 gap-4">
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

          {error ? (
            <Text className="font-sans text-sm text-error">{error}</Text>
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
