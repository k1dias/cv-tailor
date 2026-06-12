import { z } from "zod";
import { ResumeSchema } from "./resume";

export const LanguageSchema = z.enum(["pt", "en"]);
export type OutputLanguage = z.infer<typeof LanguageSchema>;

/** Análise de aderência do CV à vaga. */
export const MatchSchema = z.object({
  score: z.number().min(0).max(100).describe("Percentual de aderência 0-100."),
  metRequirements: z
    .array(
      z.object({
        requirement: z.string().describe("Requisito da vaga atendido."),
        evidence: z.string().describe("Trecho REAL do CV base que comprova. Não inventar."),
      }),
    )
    .describe("Requisitos da vaga com evidência no CV."),
  gaps: z
    .array(
      z.object({
        requirement: z.string().describe("Requisito da vaga SEM evidência no CV."),
        suggestion: z.string().optional().describe("Orientação honesta — não é experiência falsa."),
      }),
    )
    .describe("Lacunas. Listar honestamente; jamais transformar em experiência inventada."),
  keywords: z.array(z.string()).describe("Termos da vaga incorporados ao CV adaptado."),
});
export type Match = z.infer<typeof MatchSchema>;

/** Carta de apresentação (opcional). */
export const CoverLetterSchema = z.object({
  greeting: z.string().describe("Saudação, ex: 'Prezada equipe de recrutamento,'"),
  body: z.array(z.string()).describe("Parágrafos do corpo."),
  closing: z.string().describe("Fechamento + nome."),
});
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

/** Saída forçada da IA — validada por Zod. */
export const AdaptResultSchema = z.object({
  adaptedResume: ResumeSchema.describe("CV reordenado/reescrito. SEM inventar nada."),
  match: MatchSchema,
  coverLetter: CoverLetterSchema.optional(),
});
export type AdaptResult = z.infer<typeof AdaptResultSchema>;

/** Entrada da rota /api/structure (texto cru -> Resume estruturado). */
export const StructureRequestSchema = z.object({
  apiKey: z.string().min(1, "Chave de API obrigatória."),
  model: z.string().optional(),
  rawText: z.string().min(20, "Texto do CV muito curto."),
});
export type StructureRequest = z.infer<typeof StructureRequestSchema>;

/** Entrada da rota /api/adapt. */
export const AdaptRequestSchema = z.object({
  apiKey: z.string().min(1, "Chave de API obrigatória."),
  model: z.string().optional(),
  baseCvText: z.string().min(20, "CV base muito curto."),
  jobDescription: z.string().min(20, "Descrição da vaga muito curta."),
  language: LanguageSchema,
  includeCoverLetter: z.boolean(),
});
export type AdaptRequest = z.infer<typeof AdaptRequestSchema>;
