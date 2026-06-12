import { generateObject } from "ai";
import { ResumeSchema, type Resume } from "@/lib/schema/resume";
import type { StructureRequest } from "@/lib/schema/adapt";
import { resolveModel } from "./providers";

const SYSTEM = [
  "Você converte o texto de um currículo em JSON estruturado.",
  "REGRA ABSOLUTA: NÃO invente nada. Apenas estruture o que existe no texto.",
  "Se um campo não existe no texto, omita-o (não preencha com suposições).",
  "Mantenha o idioma original do currículo. Não traduza nem reescreva o conteúdo.",
].join("\n");

/**
 * Estrutura um CV em texto cru no ResumeSchema. temperature 0 para fidelidade.
 */
export async function structureResume(req: StructureRequest): Promise<Resume> {
  const model = resolveModel(req.apiKey, req.model);
  const { object } = await generateObject({
    model,
    schema: ResumeSchema,
    system: SYSTEM,
    prompt: `Estruture este currículo:\n\n${req.rawText.trim()}`,
    temperature: 0,
    providerOptions: {
      google: { thinkingConfig: { thinkingBudget: 256 } },
    },
  });
  return object;
}
