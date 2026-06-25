import { TextInput, View, Text } from "@/tw";
import { cn } from "@/lib/cn";

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string;
  className?: string;
};

export function Input({ label, className, ...props }: Props) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-t2">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="#60646C"
        className={cn(
          "rounded-xl border border-border bg-bg-2 px-4 py-3.5 text-base text-t1",
          className
        )}
        {...props}
      />
    </View>
  );
}
