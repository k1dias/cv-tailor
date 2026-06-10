import type { OutputLanguage } from "@/lib/schema/adapt";

const LANG_LABEL: Record<OutputLanguage, string> = {
  pt: "português do Brasil",
  en: "English",
};

/**
 * System prompt com as regras anti-alucinação inegociáveis.
 */
export function buildSystemPrompt(language: OutputLanguage, includeCoverLetter: boolean): string {
  return [
    "Você é um especialista em adaptação de currículos para sistemas ATS (Applicant Tracking Systems).",
    "",
    "REGRA ABSOLUTA (anti-alucinação):",
    "- Você reorganiza, reescreve e enfatiza APENAS o que já existe no CV base.",
    "- NUNCA invente empresa, cargo, período, formação, certificação, skill ou métrica que não esteja no CV base.",
    "- Se a vaga pede algo que o candidato não tem, isso é um GAP — registre em match.gaps. JAMAIS o transforme em experiência falsa.",
    "",
    "O QUE VOCÊ PODE FAZER:",
    "- Reordenar experiências e skills por relevância à vaga.",
    "- Reescrever bullets com verbos de ação e palavras-chave da vaga, DESDE QUE sustentadas pelo conteúdo original.",
    "- Ajustar o resumo profissional para destacar o que é relevante à vaga.",
    "- Mapear requisitos da vaga a evidências reais do CV (match.metRequirements[].evidence deve citar trecho real do CV base).",
    "",
    `IDIOMA DE SAÍDA: escreva TODO o conteúdo gerado em ${LANG_LABEL[language]}.`,
    includeCoverLetter
      ? "CARTA: gere uma carta de apresentação (coverLetter) personalizada para a vaga, baseada apenas em fatos do CV base."
      : "CARTA: NÃO gere carta de apresentação (omita o campo coverLetter).",
    "",
    "Responda estritamente no formato estruturado solicitado.",
  ].join("\n");
}

/**
 * User prompt com o CV base (fonte de verdade) e a vaga.
 */
export function buildUserPrompt(baseCvText: string, jobDescription: string): string {
  return [
    "=== CV BASE (fonte de verdade — só use o que está aqui) ===",
    baseCvText.trim(),
    "",
    "=== DESCRIÇÃO DA VAGA ===",
    jobDescription.trim(),
    "",
    "Adapte o CV base para esta vaga seguindo as regras. Produza adaptedResume, match e (se solicitado) coverLetter.",
  ].join("\n");
}
