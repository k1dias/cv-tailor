"use client";

import type { Provider, OutputLanguage } from "@/lib/schema/adapt";

/**
 * Configuração BYOK no browser. A chave NUNCA sai daqui exceto no corpo
 * de cada requisição /api/adapt. Limpável via lib/storage/clear.ts.
 */

const KEYS = {
  provider: "cvt.provider",
  apiKey: "cvt.apiKey",
  model: "cvt.model",
  language: "cvt.language",
} as const;

export interface KeySettings {
  provider: Provider;
  apiKey: string;
  model?: string;
  language: OutputLanguage;
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function loadSettings(): KeySettings {
  return {
    provider: (read(KEYS.provider) as Provider) || "anthropic",
    apiKey: read(KEYS.apiKey) || "",
    model: read(KEYS.model) || undefined,
    language: (read(KEYS.language) as OutputLanguage) || "pt",
  };
}

export function saveSettings(s: KeySettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.provider, s.provider);
  window.localStorage.setItem(KEYS.language, s.language);
  // Nunca persistir chave/modelo vazios — "Limpar dados" deve deixar zero rastro.
  if (s.apiKey) window.localStorage.setItem(KEYS.apiKey, s.apiKey);
  else window.localStorage.removeItem(KEYS.apiKey);
  if (s.model) window.localStorage.setItem(KEYS.model, s.model);
  else window.localStorage.removeItem(KEYS.model);
}

export function hasApiKey(): boolean {
  return !!read(KEYS.apiKey);
}

export const STORAGE_KEYS = KEYS;
