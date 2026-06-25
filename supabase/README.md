# Supabase — schema as code

Lo schema vive nel cloud (project `rmlobxjlqlpixkvrzmfg`). Lo versioniamo come
**snapshot** (`supabase/schema.sql`) e generiamo i tipi TypeScript dal cloud.

## Setup (una tantum)

Login + link (richiede il tuo access token Supabase, interattivo):

```bash
npx supabase login
npx supabase link --project-ref rmlobxjlqlpixkvrzmfg
```

## Comandi

```bash
# tipi TS dal cloud → src/types/database.ts  (NON serve Docker)
yarn db:types

# snapshot DDL dello schema public → supabase/schema.sql  (richiede Docker Desktop avviato)
yarn db:dump
```

`yarn db:types` usa l'API del progetto (token), `yarn db:dump` usa un container
Docker col `pg_dump` della versione giusta — quindi **avvia Docker Desktop** prima.

> ⚠️ Anti-drift: dopo `yarn db:types`, `git diff src/types/database.ts` deve essere
> vuoto (o solo modifiche attese). Differenze = lo schema cloud è cambiato rispetto
> al codice → riconcilia.

## Workflow migrazioni (`db pull`/`db push`) — NON ancora attivo

Lo storico migrazioni remoto è in formato "legacy" e `supabase db pull` va in
conflitto (`LegacyDbPullMigrationConflictError`). Per ora usiamo lo snapshot
`schema.sql` come riferimento versionato — sufficiente per review e onboarding.

Quando in M5+ serviranno modifiche di schema, conviene riallineare lo storico una
volta sola (con Docker avviato), poi passare a `supabase migration new` + `db push`.
Fino ad allora le modifiche di schema si fanno sul cloud e si ricattura con
`yarn db:dump` + `yarn db:types`.
