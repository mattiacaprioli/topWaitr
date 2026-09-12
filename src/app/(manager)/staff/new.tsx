import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { Mono } from "@/components/ui/Mono";
import { Pill } from "@/components/ui/Pill";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { useMyVenue } from "@/features/venues/hooks";
import {
  useAddStaffMember,
  useFindWaiterByEmail,
  useVenueStaff,
} from "@/features/staff/hooks";
import { RoleMultiSelect } from "@/features/roles/RoleMultiSelect";
import { useSetStaffMemberRoles } from "@/features/roles/hooks";
import type { WaiterLookup } from "@/features/staff/api";
import type { Enums } from "@/types/database";

type Mode = "manuale" | "invita";
const MODES: { id: Mode; label: string }[] = [
  { id: "manuale", label: "Manuale" },
  { id: "invita", label: "Invita" },
];

function TypeChips({
  value,
  onChange,
}: {
  value: Enums<"employment_type">;
  onChange: (v: Enums<"employment_type">) => void;
}) {
  return (
    <View className="flex-row gap-2">
      <Chip
        label="Fisso"
        active={value === "fisso"}
        gold={value === "fisso"}
        onPress={() => onChange("fisso")}
      />
      <Chip
        label="A chiamata"
        active={value === "a_chiamata"}
        onPress={() => onChange("a_chiamata")}
      />
    </View>
  );
}

export default function StaffNewScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const userId = session!.user.id;
  const venue = useMyVenue(userId).data ?? null;
  const venueId = venue?.id;

  const [mode, setMode] = useState<Mode>("manuale");
  const add = useAddStaffMember();
  const setRoles = useSetStaffMemberRoles();

  // Chi è già in organico: serve a distinguere, su un invito, chi è già dentro
  // da chi ha solo un invito in attesa.
  const staffQuery = useVenueStaff(venueId);
  const existingStatus = new Map<string, Enums<"staff_link_status">>(
    (staffQuery.data ?? [])
      .filter((s): s is typeof s & { waiter_id: string } => !!s.waiter_id)
      .map((s) => [s.waiter_id, s.link_status])
  );

  // Nuova scheda (manuale)
  const [name, setName] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [empType, setEmpType] = useState<Enums<"employment_type">>("a_chiamata");
  const [phone, setPhone] = useState("");

  // Invita per email
  const find = useFindWaiterByEmail();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<WaiterLookup | null>(null);
  const [searched, setSearched] = useState(false);
  const [inviteType, setInviteType] = useState<Enums<"employment_type">>("fisso");
  const foundStatus = found ? (existingStatus.get(found.id) ?? null) : null;

  function onAdded(msg: string) {
    toast.show(msg);
    router.back();
  }
  function onAddError() {
    toast.show("Operazione non riuscita. Riprova.", "error");
  }

  function addManual() {
    if (!venueId || !name.trim()) return;
    add.mutate(
      {
        venue_id: venueId,
        display_name: name.trim(),
        employment_type: empType,
        phone: phone.trim() || null,
      },
      {
        // I ruoli si scrivono dopo l'insert: hanno bisogno dell'id della scheda.
        onSuccess: (member) =>
          setRoles.mutate(
            { staffMemberId: member.id, roleIds },
            {
              onSuccess: () => onAdded("Aggiunto allo staff"),
              onError: () =>
                toast.show(
                  "Scheda creata, ma i ruoli non sono stati salvati.",
                  "error"
                ),
            }
          ),
        onError: onAddError,
      }
    );
  }

  function onSearch() {
    const e = email.trim();
    if (!e) return;
    find.mutate(e, {
      onSuccess: (res) => {
        setFound(res);
        setSearched(true);
      },
      onError: () => toast.show("Ricerca non riuscita. Riprova.", "error"),
    });
  }

  function sendInvite() {
    if (!venueId || !found) return;
    add.mutate(
      {
        venue_id: venueId,
        display_name: found.full_name ?? email.trim(),
        employment_type: inviteType,
        waiter_id: found.id,
        link_status: "pending",
      },
      { onSuccess: () => onAdded("Richiesta inviata"), onError: onAddError }
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
          gap: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader eyebrow="Staff" title="Aggiungi" />

        {/* Segmented */}
        <View className="flex-row gap-1 rounded-2xl border border-border bg-bg-card p-1">
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                className={cn(
                  "flex-1 items-center rounded-xl py-2.5",
                  active && "bg-bg-2"
                )}
              >
                <Text
                  className={cn(
                    "text-sm",
                    active ? "font-sans-semibold text-t1" : "text-t3"
                  )}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === "manuale" ? (
          <View className="gap-5">
            <Input
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Es. Marco Rossi"
            />
            <RoleMultiSelect
              venueId={venueId}
              value={roleIds}
              onChange={setRoleIds}
            />
            <View className="gap-2">
              <Mono>Tipo</Mono>
              <TypeChips value={empType} onChange={setEmpType} />
            </View>
            <Input
              label="Telefono (facoltativo)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Es. 333 1234567"
            />
            <GoldButton
              className="mt-1"
              label={add.isPending ? "Aggiunta…" : "Aggiungi allo staff"}
              disabled={add.isPending || !name.trim()}
              onPress={addManual}
            />
          </View>
        ) : (
          <View className="gap-5">
            <Input
              label="Email del professionista"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setFound(null);
                setSearched(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="nome@email.com"
            />
            <GoldButton
              label={find.isPending ? "Ricerca…" : "Cerca"}
              disabled={find.isPending || !email.trim()}
              onPress={onSearch}
            />

            {searched ? (
              found ? (
                foundStatus === "pending" ? (
                  <Card className="rounded-3xl border-border-2 p-5">
                    <View className="flex-row items-center gap-3">
                      <View className="flex-1">
                        <Text className="text-sm text-t2">
                          Hai già invitato{" "}
                          {found.full_name ?? "questa persona"}.
                        </Text>
                      </View>
                      <Pill label="In attesa di risposta" variant="pending" />
                    </View>
                  </Card>
                ) : foundStatus === "active" ? (
                  <Card className="rounded-3xl border-border-2 p-5">
                    <Text className="text-sm text-t2">
                      {found.full_name ?? "Questa persona"} è già nel tuo
                      staff.
                    </Text>
                  </Card>
                ) : (
                  <Card className="rounded-3xl border-border-2 p-5">
                    <View className="flex-row items-center gap-3">
                      <Avatar
                        uri={found.avatar_url ?? undefined}
                        name={found.full_name ?? "Cameriere"}
                        size={48}
                      />
                      <View className="flex-1">
                        <Text className="text-base font-sans-bold text-t1">
                          {found.full_name ?? "Cameriere"}
                        </Text>
                        {found.city ? (
                          <Text className="text-xs text-t3">{found.city}</Text>
                        ) : null}
                      </View>
                    </View>
                    <View className="mt-4 gap-2">
                      <Mono>Tipo</Mono>
                      <TypeChips value={inviteType} onChange={setInviteType} />
                    </View>
                    <GoldButton
                      className="mt-4"
                      label={add.isPending ? "Invio…" : "Invia richiesta"}
                      disabled={add.isPending}
                      onPress={sendInvite}
                    />
                  </Card>
                )
              ) : (
                <EmptyState
                  title="Nessun profilo trovato"
                  subtitle="Controlla che l'email sia esatta e che abbia un account da professionista su topWaitr."
                />
              )
            ) : (
              <Text className="text-xs leading-4 text-t3">
                Inserisci l&apos;email esatta della persona. Riceverà una
                richiesta e, se accetta, entrerà nel tuo organico.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
