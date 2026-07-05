import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { GhostButton } from "@/components/ui/GhostButton";
import { GoldButton } from "@/components/ui/GoldButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/providers/Toast";
import { useWaiterPublicCard } from "@/features/reviews/hooks";

// Deployed public review site (Componente B). Fallback to localhost for dev
// (`python3 -m http.server 8080` in web-review/). Set the real URL once deployed.
const REVIEW_SITE_URL =
  process.env.EXPO_PUBLIC_REVIEW_SITE_URL ?? "http://localhost:8080";

export default function WaiterQRScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session, profile } = useAuth();
  const userId = session!.user.id;
  const name = profile?.full_name ?? "Cameriere";

  const card = useWaiterPublicCard(userId).data;
  const role = card?.primary_role ?? null;
  const url = `${REVIEW_SITE_URL}/?w=${userId}`;

  async function onShare() {
    try {
      await Share.share({
        message: `Lascia una recensione a ${name} su topWaitr: ${url}`,
      });
    } catch {
      // condivisione annullata
    }
  }

  async function onCopy() {
    await Clipboard.setStringAsync(url);
    toast.show("Link copiato");
  }

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5 pb-2">
        <ScreenHeader
          icon="close"
          eyebrow="Recensione certificata"
          title="Il tuo QR"
          goldEyebrow
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
          gap: 24,
          alignItems: "center",
        }}
      >
        <Text className="text-center text-sm leading-5 text-t3">
          Mostra questo al cliente a fine servizio per ricevere una recensione
          sul tuo profilo.
        </Text>

        <View
          className="items-center gap-5 rounded-3xl p-7"
          style={{ backgroundColor: "#F6F1E3" }}
        >
          <QRCode
            value={url}
            size={220}
            backgroundColor="#F6F1E3"
            color="#1A1611"
          />
          <View className="items-center gap-0.5">
            <Text
              className="text-lg font-sans-bold"
              style={{ color: "#1A1611" }}
            >
              {name}
            </Text>
            {role ? (
              <Text className="text-xs" style={{ color: "#5B4A2E" }}>
                {role}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="w-full gap-2">
          <GoldButton label="Condividi link" onPress={onShare} />
          <GhostButton label="Copia link" onPress={onCopy} />
        </View>
      </ScrollView>
    </View>
  );
}
