import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Chip } from "@/components/ui/Chip";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { GoldButton } from "@/components/ui/GoldButton";
import { Input } from "@/components/ui/Input";
import { Mono } from "@/components/ui/Mono";
import { QueryError } from "@/components/ui/QueryError";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useToast } from "@/providers/Toast";
import {
  useRemoveStaffMember,
  useStaffMember,
  useUpdateStaffMember,
} from "@/features/staff/hooks";
import type { StaffMember } from "@/features/staff/api";
import type { Enums } from "@/types/database";

const ROLES = ["Cameriere", "Chef de Rang", "Sommelier", "Runner", "Hostess", "Barman"];

/** Editable form — state seeded from props (mounted with key={member.id}). */
function StaffEditForm({ member }: { member: StaffMember }) {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const update = useUpdateStaffMember();
  const remove = useRemoveStaffMember();
  const busy = update.isPending || remove.isPending;

  const [name, setName] = useState(member.display_name);
  const [role, setRole] = useState<string | null>(member.role);
  const [empType, setEmpType] = useState<Enums<"employment_type">>(
    member.employment_type
  );
  const [phone, setPhone] = useState(member.phone ?? "");
  const [note, setNote] = useState(member.note ?? "");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const waiterId = member.waiter_id;

  function onSave() {
    if (!name.trim()) return;
    update.mutate(
      {
        id: member.id,
        fields: {
          display_name: name.trim(),
          role,
          employment_type: empType,
          phone: phone.trim() || null,
          note: note.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.show("Scheda aggiornata");
          router.back();
        },
        onError: () => toast.show("Impossibile salvare. Riprova.", "error"),
      }
    );
  }

  function doRemove() {
    remove.mutate(member.id, {
      onSuccess: () => {
        setConfirmVisible(false);
        toast.show("Rimosso dallo staff");
        router.back();
      },
      onError: () => {
        setConfirmVisible(false);
        toast.show("Impossibile rimuovere. Riprova.", "error");
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
        <ScreenHeader eyebrow="Staff" title={member.display_name} />

        {waiterId ? (
          <Pressable
            onPress={() => router.push(`/(manager)/cameriere/${waiterId}`)}
          >
            <View className="flex-row items-center gap-3 rounded-3xl border border-border-2 bg-bg-card px-4 py-3.5">
              <Icon name="verified" size={18} color="#EAB54C" />
              <View className="flex-1">
                <Mono gold>Account app collegato</Mono>
                <Text className="mt-0.5 text-sm text-t2">
                  Vedi profilo e recensioni
                </Text>
              </View>
              <Icon name="chevR" size={18} color="#8c857a" />
            </View>
          </Pressable>
        ) : null}

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
          <View className="flex-row gap-2">
            <Chip
              label="Fisso"
              active={empType === "fisso"}
              gold={empType === "fisso"}
              onPress={() => setEmpType("fisso")}
            />
            <Chip
              label="A chiamata"
              active={empType === "a_chiamata"}
              onPress={() => setEmpType("a_chiamata")}
            />
          </View>
        </View>

        <Input
          label="Telefono (facoltativo)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Es. 333 1234567"
        />
        <Input
          label="Note (facoltative)"
          value={note}
          onChangeText={setNote}
          placeholder="Es. disponibile nei weekend"
          multiline
          numberOfLines={3}
          className="h-20"
          textAlignVertical="top"
        />

        <GoldButton
          className="mt-1"
          label={update.isPending ? "Salvataggio…" : "Salva"}
          disabled={busy || !name.trim()}
          onPress={onSave}
        />
        <Pressable
          disabled={busy}
          onPress={() => setConfirmVisible(true)}
          className="items-center rounded-2xl border border-border-2 py-3.5"
        >
          <Text className="text-sm font-sans-semibold text-error">
            Rimuovi dallo staff
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="Rimuovere dallo staff?"
        message={`${member.display_name} non sarà più nel tuo organico.`}
        confirmLabel="Rimuovi"
        destructive
        pending={remove.isPending}
        onConfirm={doRemove}
        onCancel={() => setConfirmVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

export default function StaffMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberQuery = useStaffMember(id);
  const member = memberQuery.data ?? null;

  if (memberQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-0">
        <ActivityIndicator color="#EAB54C" />
      </View>
    );
  }

  if (memberQuery.isError) {
    return (
      <View className="flex-1 justify-center bg-bg-0 px-6">
        <QueryError onRetry={() => memberQuery.refetch()} />
      </View>
    );
  }

  if (!member) {
    return (
      <View className="flex-1 bg-bg-0">
        <EmptyState
          title="Scheda non trovata"
          subtitle="Questo membro dello staff non esiste più."
        />
      </View>
    );
  }

  return <StaffEditForm key={member.id} member={member} />;
}
