import { generateObject } from "ai";
import { AdaptResultSchema, type AdaptRequest, type AdaptResult } from "@/lib/schema/adapt";
import { resolveModel } from "./providers";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

/**
 * Núcleo da adaptação: chama o provedor via generateObject (saída forçada
 * ao AdaptResultSchema). A chave é usada uma vez e descartada com o escopo.
 */
export async function runAdaptation(req: AdaptRequest): Promise<AdaptResult> {
  const model = resolveModel(req.apiKey, req.model);

  const { object } = await generateObject({
    model,
    schema: AdaptResultSchema,
    system: buildSystemPrompt(req.language, req.includeCoverLetter),
    prompt: buildUserPrompt(req.baseCvText, req.jobDescription),
    temperature: 0.2,
    // Limita tokens de raciocínio do Gemini 2.5 (thinking model).
    // Sem esse limite o free tier estoura com 1 chamada num CV real.
    providerOptions: {
      google: { thinkingConfig: { thinkingBudget: 512 } },
    },
  });

  // Garante coerência com o toggle (alguns modelos geram carta mesmo sem pedir).
  if (!req.includeCoverLetter) {
    delete (object as AdaptResult).coverLetter;
  }

  return object;
}
