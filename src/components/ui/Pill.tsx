import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";

type Variant =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "open"
  | "closed"
  | "neutral";

type Props = {
  label: string;
  variant?: Variant;
  className?: string;
};

const STYLES: Record<Variant, { bg: string; text: string }> = {
  pending: { bg: "rgba(226,146,47,0.15)", text: "#E2922F" },
  accepted: { bg: "rgba(79,201,125,0.15)", text: "#4FC97D" },
  rejected: { bg: "rgba(229,91,69,0.15)", text: "#E55B45" },
  cancelled: { bg: "rgba(140,133,122,0.2)", text: "#C2BBB0" },
  open: { bg: "rgba(79,201,125,0.15)", text: "#4FC97D" },
  closed: { bg: "rgba(140,133,122,0.2)", text: "#C2BBB0" },
  neutral: { bg: "rgba(255,240,220,0.06)", text: "#C2BBB0" },
};

export function Pill({ label, variant = "neutral", className }: Props) {
  const s = STYLES[variant];
  return (
    <View
      style={{ backgroundColor: s.bg }}
      className={cn("self-start rounded-full px-3 py-1", className)}
    >
      <Text style={{ color: s.text }} className="text-xs font-semibold">
        {label}
      </Text>
    </View>
  );
}
