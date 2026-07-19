import { Pressable, Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { setDevPlanOverride, useDevPlanOverride } from "./devOverride";

type Choice = { label: string; value: "free" | "pro" | null };

const CHOICES: Choice[] = [
  { label: "Reale", value: null },
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
];

/**
 * Toggle SOLO in sviluppo per simulare il piano e vedere i lucchetti senza
 * cambiare il dato reale. In produzione non renderizza nulla.
 */
export function DevPlanToggle() {
  const override = useDevPlanOverride();
  if (!__DEV__) return null;

  return (
    <View className="gap-2">
      <SectionHeader title="Sviluppo" />
      <View className="gap-3 rounded-3xl border border-border-2 bg-bg-card p-4">
        <Text className="text-[13px] text-t3">
          Simula piano (solo dev) — per vedere i lucchetti Pro.
        </Text>
        <View className="flex-row gap-2">
          {CHOICES.map((c) => {
            const active = override === c.value;
            return (
              <Pressable
                key={c.label}
                onPress={() => setDevPlanOverride(c.value)}
                className={cn(
                  "flex-1 items-center rounded-full border py-2",
                  active
                    ? "border-border-gold bg-bg-2"
                    : "border-border-2 bg-bg-1",
                )}
              >
                <Text
                  className={cn(
                    "font-mono text-[11px] uppercase tracking-widest",
                    active ? "text-gold" : "text-t3",
                  )}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
