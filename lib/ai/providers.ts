import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * Modelo padrão do Google Gemini — no tier free do AI Studio (sem cartão).
 * Sobrescrevível por requisição via campo "Modelo".
 */
export const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Instancia um LanguageModel (Gemini) a partir da chave do usuário.
 * A chave é usada apenas aqui, por requisição, e nunca persistida.
 */
export function resolveModel(apiKey: string, model?: string): LanguageModel {
  const modelId = model?.trim() || DEFAULT_MODEL;
  return createGoogleGenerativeAI({ apiKey })(modelId);
}
