import { Image } from "@/tw/image";
import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

const COLORS = ["#D4A843", "#208AEF", "#22C55E", "#EF4444", "#8B5CF6", "#EC4899"];

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")) || "?";
}

function colorFor(name?: string | null) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ uri, name, size = 48, className }: Props) {
  if (uri) {
    return (
      <Image
        source={uri}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className={className}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorFor(name),
      }}
      className={cn("items-center justify-center", className)}
    >
      <Text className="font-sans-bold text-white" style={{ fontSize: size * 0.4 }}>
        {initials(name).toUpperCase()}
      </Text>
    </View>
  );
}
