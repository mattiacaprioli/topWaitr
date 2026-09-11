# web — dashboard dei locali

Interfaccia **desktop** per chi gestisce un locale: programmazione turni,
copertura, ore e export contabile. Il professionista non la usa: per lui l'app
mobile basta e avanza (chi apre questa dashboard con un account professionista
riceve una schermata di cortesia, non un errore).

Stesso backend Supabase dell'app, **stessa RLS, stessa anon key**: non esistono
policy dedicate al web. L'accesso del gestore è già derivato ovunque dalla
proprietà del locale (`venues.owner_id = auth.uid()`).

## Comandi (dalla root del repo)

```bash
yarn web:dev         # dev server Vite
yarn web:build       # build di produzione → web/dist
yarn web:typecheck   # tsc con il tsconfig del web
```

⚠️ Da non confondere con `yarn web`, che è `expo start --web` (l'app mobile
renderizzata nel browser) — un'altra cosa.

## Perché non c'è un `package.json` qui

Le dipendenze web stanno nel `package.json` della **root**, come devDependencies.

Non è pigrizia: `web/` importa `../src/features/**`, che a sua volta importa
`@tanstack/react-query` e `@supabase/supabase-js`. Con una `node_modules` locale,
la risoluzione Node risalirebbe da `src/` e prenderebbe le copie di root, mentre
`web/src/**` prenderebbe le proprie → **due istanze di React Query e context
rotto**. Con una sola `node_modules` il problema non si pone. In
`vite.config.mts` c'è comunque un `resolve.dedupe` come cintura di sicurezza.

## Come funziona il riuso del data layer

Sui `src/features/*/api.ts` e `hooks.ts` solo tre file dipendono da React Native
o Expo (`onboarding/api.ts`, `plan/hooks.ts`, `push/api.ts`), e nessuno serve al
ristoratore. Bastano quindi **due alias** (in `vite.config.mts` e, identici, nei
`paths` di `tsconfig.json`):

| Alias | Sostituito con | Perché |
|---|---|---|
| `@/lib/supabase` | `web/src/lib/supabase.ts` | niente SecureStore: su web basta localStorage |
| `@/features/push/api` | `web/src/lib/pushStub.ts` | è l'unico import che rende `src/lib/auth.tsx` non portabile |

Con quei due, si riusano **verbatim** `AuthProvider`/`useAuth`, `queryClient`,
la factory `qk`, `format`, `cn`, ogni `api.ts`/`hooks.ts`/`schema.ts`,
`assignments/{hours,coverage}.ts`, `staff/roles.ts`, `lib/exportBuilders.ts` e
`RealtimeSync`. Qui dentro si scrive **solo UI**.

Regola conseguente: **niente `.from(` nei componenti web**. Ogni accesso ai dati
passa dai `features/*/api.ts`, come impone `ARCHITECTURE.md`, e ogni chiave di
query viene dalla factory `qk` — altrimenti le invalidazioni divergono tra i due
client.

## Variabili d'ambiente

Vite legge il **`.env` della root** con gli stessi nomi dell'app (`envDir` +
`envPrefix` in `vite.config.mts`): `EXPO_PUBLIC_SUPABASE_URL` e
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. Una sola configurazione Supabase, nessuna
coppia `VITE_*` da tenere allineata.

## Deploy

`.github/workflows/deploy-web-review.yml` monta un unico artifact Pages
(GitHub Pages dà un solo sito per repo): `web-review/` alla radice — l'URL delle
recensioni **non deve cambiare**, è dentro i QR già stampati — e `web/dist`
sotto `/app/`.

Per questo il router è un **HashRouter**: Pages non fa fallback SPA. Quando la
dashboard avrà un dominio proprio si passa a `BrowserRouter`.

## Scelte da conoscere prima di metterci mano

- **La registrazione dal web crea solo account `manager`**: il ruolo non si
  sceglie (a differenza dell'app), perché questa dashboard è per i locali e un
  professionista finirebbe comunque su `NotForWaitersPage`. L'account si crea
  con `signUp` condiviso di `src/lib/auth.tsx` e il locale arriva dopo, dal gate
  di `AppLayout` → `/locale`: senza sessione (conferma email attiva) la RLS non
  permetterebbe l'insert in `venues`.
  ⚠️ Il link di conferma punta all'URL della dashboard (`emailRedirectTo`): va
  aggiunto ai **Redirect URLs** del progetto Supabase, altrimenti si ripiega sul
  Site URL. Il client web ha `detectSessionInUrl: false` (i token nel fragment
  litigherebbero con l'`HashRouter`), quindi dopo la conferma si passa dal
  login: il catch-all fuori sessione ci porta da sé.
- **La presenza si modifica dal pannello del turno**, non dalla pagina Ore: è lì
  che i dati vivono già (`useShiftAssignments`). La pagina Ore aggrega per
  persona sul mese e non conosce le singole assegnazioni.
- **`web/src/shifts/schema.ts` non riusa `shiftSchema`** dell'app: quello è
  modellato sui picker RN e usa oggetti `Date`, mentre gli input nativi del
  browser danno già stringhe nel formato delle colonne DB. L'invariante che
  conta (fine dopo inizio) è la stessa, con lo stesso messaggio.
- **`positions_filled` non si scrive mai dal client**: lo tengono i trigger DB.
- Vocabolario delle stringhe utente: **professionista** e **locale**, mai
  "cameriere"/"ristoratore" (vedi `AGENTS.md`). Gli identificatori interni
  restano `waiter`/`manager`.
