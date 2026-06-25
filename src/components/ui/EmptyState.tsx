import React from "react";
import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
};

export function EmptyState({ icon, title, subtitle, className }: Props) {
  return (
    <View className={cn("items-center justify-center px-6 py-12", className)}>
      {icon}
      <Text className="mt-4 text-center text-base font-semibold text-t1">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-sm text-t3">{subtitle}</Text>
      ) : null}
    </View>
  );
}
