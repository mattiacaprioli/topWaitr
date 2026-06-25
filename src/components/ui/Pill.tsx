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
  pending: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  accepted: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  rejected: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
  cancelled: { bg: "rgba(96,100,108,0.2)", text: "#B0B4BA" },
  open: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  closed: { bg: "rgba(96,100,108,0.2)", text: "#B0B4BA" },
  neutral: { bg: "rgba(255,255,255,0.06)", text: "#B0B4BA" },
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
