import React from "react";
import { Pressable, View } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
};

export function Card({ children, className, onPress }: Props) {
  const classes = cn(
    "rounded-2xl border border-border bg-bg-card p-4",
    className
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={classes}>
        {children}
      </Pressable>
    );
  }

  return <View className={classes}>{children}</View>;
}
