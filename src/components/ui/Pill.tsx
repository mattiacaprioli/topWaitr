import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

type Variant =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "open"
  | "closed"
  | "neutral"
  | "tag";

type Props = {
  label: string;
  variant?: Variant;
  /** Optional leading line-icon, tinted to the pill's text color. */
  icon?: IconName;
  className?: string;
};

const STYLES: Record<Variant, { bg: string; text: string; border?: string }> = {
  pending: { bg: "rgba(226,146,47,0.15)", text: "#E2922F" },
  accepted: { bg: "rgba(79,201,125,0.15)", text: "#4FC97D" },
  rejected: { bg: "rgba(229,91,69,0.15)", text: "#E55B45" },
  cancelled: { bg: "rgba(140,133,122,0.2)", text: "#C2BBB0" },
  open: { bg: "rgba(79,201,125,0.15)", text: "#4FC97D" },
  closed: { bg: "rgba(140,133,122,0.2)", text: "#C2BBB0" },
  neutral: { bg: "rgba(255,240,220,0.06)", text: "#C2BBB0" },
  // Outlined gold chip — e.g. shift requirements ("✓ VELOCE").
  tag: { bg: "transparent", text: "#EAB54C", border: "rgba(234,181,76,0.4)" },
};

export function Pill({ label, variant = "neutral", icon, className }: Props) {
  const s = STYLES[variant];
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderWidth: s.border ? 1 : 0,
        borderColor: s.border,
      }}
      className={cn(
        "flex-row items-center gap-1 self-start rounded-full px-3 py-1",
        className
      )}
    >
      {icon ? (
        <Icon name={icon} size={12} color={s.text} strokeWidth={2.4} />
      ) : null}
      <Text style={{ color: s.text }} className="text-xs font-sans-semibold">
        {label}
      </Text>
    </View>
  );
}
