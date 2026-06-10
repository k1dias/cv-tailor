import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { Provider } from "@/lib/schema/adapt";

/**
 * Modelos padrão por provedor — equilibrados entre capacidade e custo
 * (o custo é do usuário, via BYOK). Sobrescrevíveis por requisição.
 */
export const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
};

/**
 * Instancia um LanguageModel a partir do provedor e da chave do usuário.
 * A chave é usada apenas aqui, por requisição, e nunca persistida.
 */
export function resolveModel(
  provider: Provider,
  apiKey: string,
  model?: string,
): LanguageModel {
  const modelId = model?.trim() || DEFAULT_MODELS[provider];

  if (provider === "anthropic") {
    return createAnthropic({ apiKey })(modelId);
  }
  return createOpenAI({ apiKey })(modelId);
}
