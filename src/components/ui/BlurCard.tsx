import { BlurView } from "expo-blur";
import React from "react";
import { View } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
};

export function BlurCard({ children, className, intensity = 40 }: Props) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-2xl border border-border",
        className
      )}
    >
      <BlurView intensity={intensity} tint="dark" style={{ padding: 16 }}>
        {children}
      </BlurView>
    </View>
  );
}
