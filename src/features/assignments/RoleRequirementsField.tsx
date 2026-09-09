import { useState } from "react";
import { Pressable, Text, View } from "@/tw";
import { Mono } from "@/components/ui/Mono";
import { SelectChip } from "@/components/ui/SelectChip";
import { cn } from "@/lib/cn";
import { STAFF_ROLES } from "@/features/staff/roles";

type Props = {
  /** Fabbisogno corrente, per ruolo. Le voci a 0 valgono come "non richiesto". */
  targets: Record<string, number>;
  onChange: (role: string, delta: number) => void;
  /** Ruoli delle persone già selezionate, per il conteggio "assegnati". */
  assignedRoles: (string | null | undefined)[];
};

/**
 * "Fabbisogno per ruolo" del turno interno, condiviso da creazione e modifica.
 *
 * È **additivo**: mostra solo i ruoli già richiesti, più un pulsante che rivela
 * i restanti. Prima disegnava una riga con +/− per OGNI ruolo esistente, il che
 * funzionava con sei ruoli ma diventa un muro di selettori quasi tutti a zero
 * ora che la lista copre anche hotel, catering ed eventi.
 */
export function RoleRequirementsField({
  targets,
  onChange,
  assignedRoles,
}: Props) {
  const [picking, setPicking] = useState(false);

  const active = STAFF_ROLES.filter((r) => (targets[r] ?? 0) > 0);
  const available = STAFF_ROLES.filter((r) => (targets[r] ?? 0) === 0);

  return (
    <View className="gap-2">
      <Mono>Fabbisogno per ruolo · facoltativo</Mono>

      {active.length === 0 && !picking ? (
        <Text className="text-[13px] leading-5 text-t3">
          Nessun fabbisogno impostato: il turno è coperto da chi selezioni qui
          sotto.
        </Text>
      ) : null}

      <View>
        {active.map((role) => {
          const target = targets[role] ?? 0;
          const assigned = assignedRoles.filter((r) => r === role).length;
          return (
            <View
              key={role}
              className="flex-row items-center justify-between py-1.5"
            >
              <View className="flex-1">
                <Text className="text-sm text-t1">{role}</Text>
                <Text
                  className={cn(
                    "text-xs",
                    assigned >= target ? "text-success" : "text-t3"
                  )}
                >
                  {assigned}/{target} assegnati
                </Text>
              </View>
              <View className="flex-row items-center gap-4">
                <Pressable
                  onPress={() => onChange(role, -1)}
                  hitSlop={8}
                  className="h-8 w-8 items-center justify-center rounded-full border border-border-2 bg-bg-2"
                >
                  <Text className="text-base text-t1">−</Text>
                </Pressable>
                <Text className="w-5 text-center font-sans-semibold text-t1">
                  {target}
                </Text>
                <Pressable
                  onPress={() => onChange(role, 1)}
                  hitSlop={8}
                  className="h-8 w-8 items-center justify-center rounded-full border border-border-2 bg-bg-2"
                >
                  <Text className="text-base text-t1">+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {picking ? (
        <View className="mt-1 flex-row flex-wrap gap-2">
          {available.map((role) => (
            <SelectChip
              key={role}
              label={role}
              onPress={() => {
                onChange(role, 1);
                if (available.length === 1) setPicking(false);
              }}
            />
          ))}
        </View>
      ) : available.length > 0 ? (
        <Pressable
          onPress={() => setPicking(true)}
          hitSlop={8}
          className="mt-1 flex-row items-center gap-2 self-start"
        >
          <Text className="text-base text-gold">+</Text>
          <Text className="text-[13px] font-sans-semibold text-gold">
            Aggiungi ruolo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
