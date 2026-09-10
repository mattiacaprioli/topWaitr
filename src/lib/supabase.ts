import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore has a 2048-byte limit per key — chunk large values
const CHUNK_SIZE = 1800;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const direct = await SecureStore.getItemAsync(key);
    if (direct !== null) return direct;

    const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
    if (!countStr) return null;

    const count = parseInt(countStr, 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length));
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunks[i]);
    }
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
    const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}__chunks`);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// `autoRefreshToken` avvia un timer che, su React Native, continua a girare con
// l'app in background: ogni refresh riscrive una riga in `auth.refresh_tokens`
// (WAL, cioè scrittura su disco) e rifà i chunk in SecureStore, per un'app che
// nessuno sta guardando. Il pattern raccomandato è legarlo al ciclo di vita:
// attivo quando l'app è in primo piano, fermo altrimenti. Alla riapertura
// Supabase rinfresca subito se il token è scaduto, quindi non si perde nulla.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
