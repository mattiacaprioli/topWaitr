import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { Mono } from "@/components/ui/Mono";
import { QueryError } from "@/components/ui/QueryError";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { useMyVenue } from "@/features/venues/hooks";
import {
  useAddStaffMember,
  useFindWaiterByEmail,
  useVenueStaff,
  useWorkedWithWaiters,
} from "@/features/staff/hooks";
import type { WaiterLookup } from "@/features/staff/api";
import type { Enums } from "@/types/database";

type Mode = "storico" | "manuale" | "invita";
const MODES: { id: Mode; label: string }[] = [
  { id: "storico", label: "Storico" },
  { id: "manuale", label: "Manuale" },
  { id: "invita", label: "Invita" },
];
const ROLES = ["Cameriere", "Chef de Rang", "Sommelier", "Runner", "Hostess", "Barman"];

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
  const userId = session!.user.id;
  const venue = useMyVenue(userId).data ?? null;
  const venueId = venue?.id;

  const [mode, setMode] = useState<Mode>("storico");
  const add = useAddStaffMember();

  // Camerieri già in organico (attivi o invitati) — per escluderli.
  const staffQuery = useVenueStaff(venueId);
  const existing = new Set(
    (staffQuery.data ?? [])
      .map((s) => s.waiter_id)
      .filter((id): id is string => !!id)
  );

  // Dallo storico
  const workedQuery = useWorkedWithWaiters(venueId);
  const candidates = (workedQuery.data ?? []).filter((w) => !existing.has(w.id));

  // Nuova scheda (manuale)
  const [name, setName] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [empType, setEmpType] = useState<Enums<"employment_type">>("a_chiamata");
  const [phone, setPhone] = useState("");

  // Invita per email
  const find = useFindWaiterByEmail();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<WaiterLookup | null>(null);
  const [searched, setSearched] = useState(false);
  const [inviteType, setInviteType] = useState<Enums<"employment_type">>("fisso");
  const alreadyInStaff = found ? existing.has(found.id) : false;

  function onAdded(msg: string) {
    toast.show(msg);
    router.back();
  }
  function onAddError() {
    toast.show("Operazione non riuscita. Riprova.", "error");
  }

  function addFromWorked(w: {
    id: string;
    full_name: string | null;
    primary_role: string | null;
  }) {
    if (!venueId) return;
    add.mutate(
      {
        venue_id: venueId,
        display_name: w.full_name ?? "Cameriere",
        role: w.primary_role,
        waiter_id: w.id,
        employment_type: "a_chiamata",
      },
      { onSuccess: () => onAdded("Aggiunto allo staff"), onError: onAddError }
    );
  }

  function addManual() {
    if (!venueId || !name.trim()) return;
    add.mutate(
      {
        venue_id: venueId,
        display_name: name.trim(),
        role,
        employment_type: empType,
        phone: phone.trim() || null,
      },
      { onSuccess: () => onAdded("Aggiunto allo staff"), onError: onAddError }
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-bg-1"
        contentContainerClassName="p-6 gap-5"
        keyboardShouldPersistTaps="handled"
      >
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

        {mode === "storico" ? (
          workedQuery.isLoading || staffQuery.isLoading ? (
            <ActivityIndicator color="#EAB54C" className="mt-6" />
          ) : workedQuery.isError ? (
            <QueryError onRetry={() => workedQuery.refetch()} />
          ) : candidates.length === 0 ? (
            <EmptyState
              title="Nessun candidato"
              subtitle="Qui compaiono i camerieri che hanno già lavorato da te e non sono ancora nel tuo staff. Usa «Manuale» o «Invita»."
            />
          ) : (
            <View className="gap-3">
              {candidates.map((w) => (
                <Card key={w.id} className="rounded-3xl border-border-2 p-4">
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      uri={w.avatar_url ?? undefined}
                      name={w.full_name ?? "Cameriere"}
                      size={44}
                    />
                    <View className="flex-1">
                      <Text className="text-base font-sans-bold text-t1">
                        {w.full_name ?? "Cameriere"}
                      </Text>
                      {w.primary_role ? (
                        <Text className="text-xs text-t3">{w.primary_role}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      disabled={add.isPending}
                      onPress={() => addFromWorked(w)}
                      className="rounded-full bg-gold px-4 py-2"
                    >
                      <Text className="text-sm font-sans-semibold text-gold-ink">
                        Aggiungi
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          )
        ) : mode === "manuale" ? (
          <View className="gap-5">
            <Input
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Es. Marco Rossi"
            />
            <View className="gap-2">
              <Mono>Ruolo</Mono>
              <View className="flex-row flex-wrap gap-2">
                {ROLES.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    active={role === r}
                    gold={role === r}
                    onPress={() => setRole(role === r ? null : r)}
                  />
                ))}
              </View>
            </View>
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
              label="Email del cameriere"
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
                alreadyInStaff ? (
                  <Card className="rounded-3xl border-border-2 p-5">
                    <Text className="text-sm text-t2">
                      {found.full_name ?? "Questo cameriere"} è già nel tuo
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
                  title="Nessun cameriere trovato"
                  subtitle="Controlla che l'email sia esatta e che abbia un account cameriere su topWaitr."
                />
              )
            ) : (
              <Text className="text-xs leading-4 text-t3">
                Inserisci l&apos;email esatta del cameriere. Riceverà una
                richiesta e, se accetta, entrerà nel tuo organico.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
