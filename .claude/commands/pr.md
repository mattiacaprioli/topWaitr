Create a pull request for the current branch against `main`.

Follow these steps:

1. Run `git status -sb` and `git diff main...HEAD` to understand what changes are included.

2. **Pre-PR Review** — esegui una review sui file modificati prima di procedere:
   a. Ricava la lista dei file modificati/aggiunti combinando:
      - `git diff --name-only main...HEAD` (file committati sulla branch)
      - `git diff --name-only` (file con modifiche non committate)
      Unisci le due liste, rimuovi duplicati, filtra solo i file `.ts`, `.tsx`, `.js`, `.jsx`
      che si trovano in `src/`.
   b. Se la lista è vuota, salta questa fase e vai al passo 3.
   c. Lancia in parallelo i tre subagent (Agent tool), passando la lista file come scope esplicito:
      - **code-reviewer** — qualità del codice, SRP, DRY, naming, error handling
      - **principles-enforcer** — NativeWind via `@/tw`, no Tamagui, data layer Supabase, Stack.Protected, gotcha `<Link>`
      - **techdebt-analyzer** — tech debt, dead code, TODO, componenti grandi
   d. Consolida i risultati eliminando duplicati e classifica tutto per priorità:
      - **CRITICAL** — bug o violazione grave che blocca la PR
      - **HIGH** — problema importante da risolvere prima del merge
      - **MEDIUM** — da pianificare nel prossimo milestone
      - **LOW** — nice-to-have, refactoring opzionale
   e. **Se ci sono problemi CRITICAL**: mostra all'utente il report completo, avverti chiaramente che
      **la PR è BLOCCATA** finché i problemi CRITICAL non vengono risolti, e **interrompi il flusso**
      (non procedere con i passi successivi).
   f. Se ci sono solo problemi HIGH/MEDIUM/LOW (nessun CRITICAL): mostra il report come avviso e
      chiedi conferma all'utente se vuole procedere comunque con la creazione della PR.
   g. Se non ci sono problemi: comunica l'esito positivo e prosegui al passo 3.

3. Check the current branch name. If the current branch **is `main`**:
   - If there are uncommitted changes, commit them directly to `main` with an appropriate Conventional Commits message, then push. Skip the PR steps and stop.
   - If there are no uncommitted changes and no commits ahead, tell the user there is nothing to do and stop.
4. Run `git log main...HEAD --oneline` to see all commits on this branch.
5. If the branch has no commits ahead of main, tell the user and stop.
6. If there are uncommitted changes, ask the user if they want to commit them first before creating the PR.
7. Check if the branch has a remote tracking branch. If not, push with `git push -u origin HEAD`.

8. Draft a PR title using **Conventional Commits** format with scope:

```
<type>(<scope>): <short description>
```

- **type**: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore` | `revert`
- **scope**: the app area affected, e.g. `auth`, `waiter`, `manager`, `shifts`, `venues`, `applications`, `chat`, `profile`, `ui`
- **description**: imperative mood, lowercase, no period, max 70 chars total

Examples:
- `feat(shifts): add publish shift form`
- `fix(auth): resolve invisible tappable link on login`
- `refactor(manager): extract applications data layer`

9. Write the PR body in this format:

```
## Summary
- <bullet points describing what changed and why>

## Test plan
- [ ] <what to test>
- [ ] <edge cases to verify>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

10. Create the PR with `gh pr create --title "..." --body "..."`.
11. Return the PR URL to the user.

If the user provides additional context as an argument (`$ARGUMENTS`), use it to inform the title and summary.
