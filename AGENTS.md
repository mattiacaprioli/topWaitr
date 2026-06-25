# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

# topWaitr

Marketplace di turni per la ristorazione (mercato italiano). I **camerieri** trovano e si candidano ai turni pubblicati dai **ristoratori**. Niente Stripe nel MVP.

## Stack
| Categoria | Tecnologia |
|-----------|-----------|
| Framework | React 19 + React Native 0.85 + **Expo SDK 56** |
| Routing | **Expo Router** (file-based, gruppi `(auth)`/`(waiter)`/`(manager)`) |
| Backend | **Supabase** (auth, DB, realtime, storage) — no GraphQL/Relay |
| Styling | **NativeWind v5** (Tailwind v4 CSS-first) via wrapper `@/tw` |
| UI | Componenti React Native + primitive in `src/components/ui/` |
| Lint | `expo lint` (eslint) — nessun Biome/Prettier |
| Lingua | Stringhe utente in **italiano inline** (no lib i18n) |
| Package manager | **npm** (`package-lock.json`) |

## Comandi
```bash
npm start                 # Expo dev server
npm run ios               # iOS simulator
npm run android           # Android emulator
npm run web               # web
npm run lint              # expo lint (eslint)
npx tsc --noEmit          # type-check
npx expo export --platform ios   # verifica bundle
```

## Struttura
```
src/
├── app/                  # Expo Router
│   ├── _layout.tsx       # AuthProvider + RootNavigator (Stack.Protected) + SplashScreen
│   ├── (auth)/           # welcome, login, signup
│   ├── (waiter)/         # home camerieri (M5)
│   ├── (manager)/        # index, venue, shift/new, shift/[id]
│   └── (dev)/            # components.tsx — demo design system
├── components/ui/        # primitive: GoldButton, GhostButton, BlurCard, Card,
│                         #   Avatar, Pill, Chip, Input, SectionHeader, EmptyState,
│                         #   ShimmerText, Icon, Logo, LogoBadge, Mono, Display
├── lib/                  # supabase.ts, auth.tsx, manager.ts, format.ts, cn.ts
├── tw/                   # wrapper CSS-class (index/image/animated) per NativeWind
├── types/database.ts     # tipi DB generati
├── constants/theme.ts    # colori, spacing, font (palette AURA)
└── global.css            # import Tailwind v4 + @theme token
```

## Path alias
`@/` → `src/`. Es. `import { cn } from "@/lib/cn"`, `import { View, Text } from "@/tw"`.

## Auth & navigazione
- Pattern ufficiale Expo Router v56: `Stack.Protected` con 3 guard — `!session` → `(auth)`, `session && role==='manager'` → `(manager)`, `session && role==='waiter'` → `(waiter)`. Nessun `index.tsx` root.
- `AuthProvider`/`useAuth()` in `src/lib/auth.tsx`: `getSession()` + `onAuthStateChange` → `ensureProfile()` (select-or-insert in `profiles`, RLS `id=auth.uid()`). Ruolo letto da `user_metadata`. Nessun trigger su `auth.users`.

## Dati (Supabase)
- Query/mutation nel data layer `src/lib/*.ts` (`getX`/`saveX`/`createX`/`updateX`), **mai** fetch diretti nei componenti.
- Tipi da `src/types/database.ts`. Controllare sempre `error`. Le RLS filtrano per `auth.uid()`.

## Convenzioni UI (vedi anche `.claude/skills/new-component`)
- Importare i componenti con `className` da **`@/tw`**, non da `react-native`. Comporre le classi con `cn()`.
- **Niente Tamagui.** `style`/`StyleSheet` solo per valori dinamici (eccezione: `Pill` usa `rgba` inline per il workaround color-mix).
- ⚠️ **Gotcha**: NON usare `<Link className=...>` da `@/tw` per testo tappabile (testo invisibile/non tappabile). Usare `Pressable` + `useRouter().push()` con `Text` stilizzato.
- Named export per le primitive; `export default` per le schermate Expo Router.
- Nessun `console.log` committato. Nessun `babel.config.js` (Tailwind v4 CSS-first; config in `metro.config.js`).

## Tooling Claude (`.claude/`)
- **Subagent**: `code-reviewer`, `principles-enforcer`, `techdebt-analyzer`.
- **Comandi**: `/full-review` (review parallela con i 3 subagent), `/pr` (pre-review + PR Conventional Commits).
- **Skill**: `new-component` (creare componenti/screen secondo le convenzioni), `improve` (audit read-only + piani per altri agent).
