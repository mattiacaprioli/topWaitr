import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Display } from "@/components/ui/Display";
import { Mono } from "@/components/ui/Mono";
import { Icon } from "@/components/ui/Icon";
import { GoldButton } from "@/components/ui/GoldButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ControlledInput } from "@/components/form/ControlledInput";
import { ControlledChoiceChips } from "@/components/form/ControlledChoiceChips";
import { ControlledMultiChips } from "@/components/form/ControlledMultiChips";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import {
  useCompleteOnboarding,
  useUploadCertification,
} from "@/features/onboarding/hooks";
import {
  CERTIFICATION_OPTIONS,
  PRIMARY_ROLE_OPTIONS,
  SKILL_OPTIONS,
} from "@/features/onboarding/api";
import {
  onboardingSchema,
  type OnboardingForm,
} from "@/features/onboarding/schema";

const TOTAL_STEPS = 2;
type CertState = "idle" | "uploading" | "done";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session, profile, refreshProfile } = useAuth();
  const userId = session!.user.id;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [certStatus, setCertStatus] = useState<Record<string, CertState>>({});

  const complete = useCompleteOnboarding(userId);
  const uploadCert = useUploadCertification(userId);

  const { control, handleSubmit, trigger } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      city: "",
      primary_role: "",
      skills: [],
    },
  });

  const firstName = (profile?.full_name ?? "").trim().split(" ")[0];
  const doneTitle = firstName ? `Tutto pronto, ${firstName}.` : "Tutto pronto!";

  const onContinue = async () => {
    const ok = await trigger(["full_name", "city", "primary_role"]);
    if (ok) setStep(2);
  };

  const onCreate = handleSubmit(async (values) => {
    try {
      await complete.mutateAsync({
        full_name: values.full_name.trim(),
        city: values.city.trim() || null,
        primary_role: values.primary_role,
        skills: values.skills,
      });
      // NON chiamiamo refreshProfile qui: il gate scatterebbe subito e la
      // schermata di successo non verrebbe mostrata. Rimane in (onboarding).
      setStep(3);
    } catch {
      toast.show("Impossibile creare il profilo. Riprova.", "error");
    }
  });

  const onEnter = async () => {
    // Solo ora aggiorniamo il profilo in memoria → il guard passa a (waiter).
    await refreshProfile();
  };

  const onPickCert = async (certKey: string) => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    const asset = res.canceled ? null : res.assets[0];
    if (!asset) return;
    setCertStatus((s) => ({ ...s, [certKey]: "uploading" }));
    try {
      await uploadCert.mutateAsync({
        certKey,
        file: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
      });
      setCertStatus((s) => ({ ...s, [certKey]: "done" }));
      toast.show("Certificazione caricata · in verifica");
    } catch {
      setCertStatus((s) => ({ ...s, [certKey]: "idle" }));
      toast.show("Upload non riuscito. Riprova.", "error");
    }
  };

  // Schermata di successo (step 3) — takeover a tutto schermo.
  if (step === 3) {
    return (
      <View
        className="flex-1 bg-bg-0 px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <View className="flex-1 items-center justify-center">
          <View
            className="h-24 w-24 items-center justify-center rounded-full bg-gold"
            style={{
              shadowColor: "#EAB54C",
              shadowOpacity: 0.5,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Icon name="check" size={44} color="#1A1206" />
          </View>
          <Mono gold className="mt-6">
            Profilo creato
          </Mono>
          <Display className="mt-2 text-center text-[30px]">{doneTitle}</Display>
          <Text className="mt-2 text-center font-sans text-[13.5px] leading-5 text-t3">
            Verifica identità in corso (entro 24h). Inizia subito a costruire la
            tua reputazione.
          </Text>

          <View className="mt-8 w-full overflow-hidden rounded-3xl border border-border-2 bg-bg-card">
            {[
              { icon: "qr" as const, label: "Mostra il QR al primo cliente" },
              { icon: "upload" as const, label: "Carica altre certificazioni" },
              { icon: "star" as const, label: "Raccogli le tue prime recensioni" },
            ].map((row, i) => (
              <View
                key={row.label}
                className={cn(
                  "flex-row items-center gap-3 p-4",
                  i > 0 && "border-t border-border"
                )}
              >
                <Icon name={row.icon} size={18} color="#EAB54C" />
                <Text className="flex-1 font-sans text-[14px] text-t1">
                  {row.label}
                </Text>
                <Icon name="chevR" size={16} color="#6A6358" />
              </View>
            ))}
          </View>
        </View>

        <GoldButton size="lg" label="Inizia" onPress={onEnter} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
    >
      <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
        {/* Header: indietro + barra di avanzamento */}
        <View className="flex-row items-center gap-4 px-5 py-3">
          <Pressable
            onPress={() => step === 2 && setStep(1)}
            disabled={step === 1}
            hitSlop={8}
            className={cn(
              "h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-1",
              step === 1 && "opacity-0"
            )}
          >
            <Icon name="chevL" size={18} color="#C2BBB0" />
          </Pressable>
          <ProgressBar progress={step / TOTAL_STEPS} className="flex-1" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 24,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <View>
                <Mono gold>Passo 1 · Il tuo profilo</Mono>
                <Display className="mt-2 text-[32px]">Chi sei?</Display>
                <Text className="mt-2 font-sans text-[13.5px] leading-5 text-t3">
                  Queste informazioni appariranno sul tuo profilo pubblico.
                </Text>
              </View>
              <ControlledInput
                control={control}
                name="full_name"
                label="Nome e cognome"
                placeholder="Es. Marco Rossi"
                autoCapitalize="words"
              />
              <ControlledInput
                control={control}
                name="city"
                label="Città"
                placeholder="Milano"
              />
              <ControlledChoiceChips
                control={control}
                name="primary_role"
                label="Ruolo principale"
                options={PRIMARY_ROLE_OPTIONS}
              />
            </>
          ) : (
            <>
              <View>
                <Mono gold>Passo 2 · Competenze</Mono>
                <Display className="mt-2 text-[32px]">
                  Cosa sai fare meglio?
                </Display>
                <Text className="mt-2 font-sans text-[13.5px] leading-5 text-t3">
                  Seleziona le tue aree. I badge si confermeranno con le
                  recensioni verificate o caricando un attestato.
                </Text>
              </View>
              <ControlledMultiChips
                control={control}
                name="skills"
                label="Le tue aree"
                options={SKILL_OPTIONS}
              />

              <View className="gap-3">
                <Mono>Hai certificazioni? · Facoltativo</Mono>
                {CERTIFICATION_OPTIONS.map((cert) => {
                  const state = certStatus[cert.key] ?? "idle";
                  const done = state === "done";
                  return (
                    <Pressable
                      key={cert.key}
                      onPress={() => onPickCert(cert.key)}
                      disabled={state === "uploading"}
                      className={cn(
                        "flex-row items-center gap-3 rounded-2xl border bg-bg-card p-4",
                        !done && "border-border-2"
                      )}
                      style={
                        done ? { borderColor: "rgba(79,201,125,0.45)" } : undefined
                      }
                    >
                      <View className="h-11 w-11 items-center justify-center rounded-xl border border-border-2 bg-bg-1">
                        <Icon
                          name={done ? "verified" : "upload"}
                          size={20}
                          color={done ? "#4FC97D" : "#8C857A"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans-semibold text-[15px] text-t1">
                          {cert.title}
                        </Text>
                        <Text
                          className={cn(
                            "mt-0.5 font-sans text-[12.5px]",
                            done ? "text-success" : "text-t3"
                          )}
                        >
                          {done
                            ? "Caricato · in verifica"
                            : state === "uploading"
                              ? "Caricamento…"
                              : cert.sub}
                        </Text>
                      </View>
                      {state === "uploading" ? (
                        <ActivityIndicator color="#EAB54C" />
                      ) : done ? (
                        <Icon name="check" size={18} color="#4FC97D" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer con CTA */}
        <View
          className="px-6 pt-2"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {step === 1 ? (
            <GoldButton size="lg" label="Continua" onPress={onContinue} />
          ) : (
            <GoldButton
              size="lg"
              label={complete.isPending ? "Creazione…" : "Crea il mio profilo"}
              disabled={complete.isPending}
              onPress={onCreate}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
