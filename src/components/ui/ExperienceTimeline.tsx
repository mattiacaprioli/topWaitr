import { Pressable, Text, View } from "@/tw";
import { Icon } from "@/components/ui/Icon";
import { Mono } from "@/components/ui/Mono";
import type { Experience } from "@/features/experiences/api";

type Props = {
  items: Experience[];
  /** Se presente, ogni riga è tappabile (owner) e mostra la matita. */
  onPressItem?: (id: string) => void;
};

/**
 * Timeline verticale delle esperienze (stile LinkedIn): colonna anni a sinistra,
 * pallino gold + linea di connessione, contenuto a destra.
 */
export function ExperienceTimeline({ items, onPressItem }: Props) {
  return (
    <View>
      {items.map((item, i) => (
        <ExperienceRow
          key={item.id}
          item={item}
          isLast={i === items.length - 1}
          onPress={onPressItem ? () => onPressItem(item.id) : undefined}
        />
      ))}
    </View>
  );
}

function ExperienceRow({
  item,
  isLast,
  onPress,
}: {
  item: Experience;
  isLast: boolean;
  onPress?: () => void;
}) {
  const start = item.start_year != null ? String(item.start_year) : "—";
  const end = item.end_year != null ? String(item.end_year) : "OGGI";

  const content = (
    <View className="flex-row gap-3">
      {/* Colonna anni */}
      <View className="w-11 items-end pt-0.5">
        <Mono gold>{start}</Mono>
        <Mono className="mt-1">{end}</Mono>
      </View>

      {/* Rail: pallino + linea di connessione */}
      <View className="items-center pt-1">
        <View className="h-2.5 w-2.5 rounded-full bg-gold" />
        {!isLast ? <View className="mt-1 w-0.5 flex-1 bg-border" /> : null}
      </View>

      {/* Contenuto */}
      <View className={isLast ? "flex-1" : "flex-1 pb-6"}>
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-base font-sans-bold text-t1">
            {item.company_name}
          </Text>
          {onPress ? (
            <Icon name="pencil" size={16} color="#5A5348" />
          ) : null}
        </View>
        {item.role ? (
          <Text className="mt-0.5 text-sm text-t2">{item.role}</Text>
        ) : null}
        {item.detail ? (
          <Text className="mt-1 text-sm leading-5 text-t3">{item.detail}</Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
