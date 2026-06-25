# Supabase — schema as code

Lo schema vive nel cloud (project `rmlobxjlqlpixkvrzmfg`). Per versionarlo e
generare i tipi TypeScript, esegui **una tantum** il login + link (richiede il
tuo access token Supabase, interattivo):

```bash
npx supabase login
npx supabase link --project-ref rmlobxjlqlpixkvrzmfg
```

Poi:

```bash
# scarica lo schema cloud (incl. RLS) come migrazione versionata
yarn db:pull            # → supabase/migrations/<timestamp>_remote_schema.sql

# rigenera i tipi TS dal cloud (sostituisce src/types/database.ts)
yarn db:types
```

> ⚠️ Verifica anti-drift: dopo `yarn db:types`, controlla con `git diff
> src/types/database.ts` che il file generato combaci con quello mantenuto a
> mano (l'app dipende da quei tipi esatti). Differenze = drift tra cloud e
> codice da riconciliare.

Da qui in avanti le modifiche allo schema si fanno con nuove migrazioni
(`supabase migration new <nome>`) + `supabase db push`, non più dal pannello web.
