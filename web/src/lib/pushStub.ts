// Stub no-op di `src/features/push/api.ts` per la dashboard web.
//
// Le push OS sono una cosa del device: sul web non si registra alcun token.
// Esiste solo perché `src/lib/auth.tsx` importa `unregisterCurrentPushToken`
// nel signOut — è l'unica dipendenza React Native dell'AuthProvider, e
// neutralizzarla permette di riusare l'auth dell'app verbatim.
// Le firme devono restare allineate all'originale.

export async function savePushToken(_token: string): Promise<void> {
  // no-op sul web
}

export async function unregisterCurrentPushToken(): Promise<void> {
  // no-op sul web
}
