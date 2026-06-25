import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Text, View } from "@/tw";
import { Input } from "@/components/ui/Input";

type Props<T extends FieldValues> = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChangeText"
> & {
  control: Control<T>;
  name: Path<T>;
};

/** RHF-bound text field: wraps the Input primitive and renders the Zod error. */
export function ControlledInput<T extends FieldValues>({
  control,
  name,
  ...inputProps
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View className="gap-1.5">
          <Input
            value={(value as string) ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            {...inputProps}
          />
          {error ? (
            <Text className="font-sans text-xs text-error">{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
