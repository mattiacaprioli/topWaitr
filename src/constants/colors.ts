/**
 * Valori colore per l'uso in JS (prop/style nativi) dove le classi NativeWind non
 * arrivano: `color=` di ActivityIndicator/Icon, stili di react-navigation, ecc.
 *
 * ⚠️ Tenere allineati ai token in `src/global.css` (@theme). Le classi Tailwind
 * (`text-gold`, `bg-bg-card`…) restano la via preferita per le `className`.
 */
export const palette = {
  gold: "#EAB54C", // --color-gold
  textMuted: "#8C857A", // --color-t3
  bg: "#0C0907", // --color-bg-0
  surface: "#15110B", // pannello scuro flottante (tab bar)
  hairline: "rgba(255,240,220,0.08)",
} as const;
