import { TextInput, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Mono } from "./Mono";

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string;
  className?: string;
};

export function Input({ label, className, ...props }: Props) {
  return (
    <View className="gap-2">
      {label ? <Mono>{label}</Mono> : null}
      <TextInput
        placeholderTextColor="#6A6358"
        className={cn(
          "rounded-[14px] border border-border bg-bg-1 px-4 py-3.5 font-sans text-[16px] text-t1",
          className
        )}
        {...props}
      />
    </View>
  );
}
