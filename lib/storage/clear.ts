"use client";

import { clearAllData } from "./db";
import { STORAGE_KEYS } from "./keystore";

/**
 * Limpa TUDO que a app guarda no navegador: a chave de API (localStorage)
 * e o CV base + histórico (IndexedDB). Camada extra de mitigação BYOK.
 */
export async function wipeAllLocalData(): Promise<void> {
  if (typeof window !== "undefined") {
    for (const k of Object.values(STORAGE_KEYS)) {
      window.localStorage.removeItem(k);
    }
  }
  await clearAllData();
}
