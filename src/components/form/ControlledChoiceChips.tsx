import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { ScrollView } from "react-native";
import { Pressable, Text, View } from "@/tw";
import { Mono } from "@/components/ui/Mono";
import { cn } from "@/lib/cn";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: readonly string[];
};

/** RHF-bound single-select chips (horizontal scroll). Tap again to deselect. */
export function ControlledChoiceChips<T extends FieldValues>({
  control,
  name,
  label,
  options,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View className="gap-2">
          <Mono>{label}</Mono>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {options.map((opt) => {
              const active = value === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => onChange(active ? "" : opt)}
                  className={cn(
                    "rounded-full px-4 py-2",
                    active ? "bg-gold" : "border border-border-2"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-sans-semibold",
                      active ? "text-gold-ink" : "text-t3"
                    )}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    />
  );
}
