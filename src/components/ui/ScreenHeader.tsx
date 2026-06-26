import { useRouter } from "expo-router";
import { Pressable, View } from "@/tw";
import { Display } from "./Display";
import { Icon } from "./Icon";
import { Mono } from "./Mono";

type Props = {
  /** Mono uppercase eyebrow (e.g. "3 candidature" or "Profilo · Onboarding"). */
  eyebrow: string;
  title: string;
  goldEyebrow?: boolean;
  /** Defaults to router.back(). */
  onBack?: () => void;
};

/**
 * In-body screen header with the prototype's circular back button + serif title.
 * Use on pushed screens with the native Stack header hidden (headerShown:false).
 */
export function ScreenHeader({ eyebrow, title, goldEyebrow, onBack }: Props) {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-3.5">
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={8}
        className="h-12 w-12 items-center justify-center rounded-full border border-border-2 bg-bg-2"
      >
        <Icon name="chevL" size={22} color="#F8F4ED" />
      </Pressable>
      <View className="flex-1">
        <Mono gold={goldEyebrow}>{eyebrow}</Mono>
        <Display className="mt-1 text-3xl">{title}</Display>
      </View>
    </View>
  );
}
