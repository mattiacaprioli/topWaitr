/**
 * Registered font-family names (loaded via useFonts in app/_layout.tsx).
 * In React Native the weight/style is part of the family name — there is no
 * synthetic bolding/italicising. Use these for the signature brand type so it
 * renders regardless of whether the Tailwind `font-*` utility compiles.
 */
export const FontFamily = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  serif: "Fraunces_400Regular",
  serifSemibold: "Fraunces_600SemiBold",
  serifItalic: "Fraunces_400Regular_Italic",
  mono: "IBMPlexMono_500Medium",
} as const;
