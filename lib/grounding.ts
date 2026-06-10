import type { Resume } from "@/lib/schema/resume";

/**
 * Rede de segurança anti-alucinação (pós-geração). Confere que empresas,
 * cargos, skills e certificações do CV adaptado têm ancoragem no CV base.
 * É deliberadamente LENIENTE: só alerta quando NENHUM token significativo do
 * item aparece no texto base — pega itens fabricados sem punir reescritas.
 */

export interface GroundingWarning {
  kind: "experience" | "skill" | "certification";
  label: string;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9+#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((t) => t.length >= 2);
}

/** true se ao menos um token significativo do valor aparece no texto base. */
function isAnchored(value: string, normalizedBase: string): boolean {
  const tokens = significantTokens(value);
  if (tokens.length === 0) return true; // nada a verificar
  return tokens.some((t) => normalizedBase.includes(t));
}

export function checkGrounding(adapted: Resume, baseCvText: string): GroundingWarning[] {
  const base = normalize(baseCvText);
  const warnings: GroundingWarning[] = [];

  for (const e of adapted.experience) {
    if (!isAnchored(e.company, base) && !isAnchored(e.title, base)) {
      warnings.push({ kind: "experience", label: `${e.title} — ${e.company}` });
    }
  }

  for (const g of adapted.skills) {
    for (const item of g.items) {
      if (!isAnchored(item, base)) {
        warnings.push({ kind: "skill", label: item });
      }
    }
  }

  for (const c of adapted.certifications ?? []) {
    if (!isAnchored(c.name, base)) {
      warnings.push({ kind: "certification", label: c.name });
    }
  }

  return warnings;
}
