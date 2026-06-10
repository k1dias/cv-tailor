import type { Resume } from "@/lib/schema/resume";

/**
 * Serializa um Resume estruturado de volta para texto plano legível.
 * Usado como `baseCvText` na adaptação quando o usuário editou o CV base
 * estruturado — garante que a fonte de verdade reflete as edições.
 */
export function resumeToText(r: Resume): string {
  const lines: string[] = [];
  const c = r.contact;
  lines.push(c.name);
  const contactLine = [c.email, c.phone, c.location].filter(Boolean).join(" | ");
  if (contactLine) lines.push(contactLine);
  if (c.links.length) lines.push(c.links.map((l) => `${l.label}: ${l.url}`).join(" | "));

  if (r.summary) {
    lines.push("", "RESUMO", r.summary);
  }

  if (r.experience.length) {
    lines.push("", "EXPERIÊNCIA");
    for (const e of r.experience) {
      const period = `${e.start} - ${e.current ? "Atual" : e.end ?? ""}`.trim();
      lines.push(`${e.title} — ${e.company}${e.location ? `, ${e.location}` : ""} (${period})`);
      for (const b of e.bullets) lines.push(`- ${b}`);
    }
  }

  if (r.skills.length) {
    lines.push("", "SKILLS");
    for (const g of r.skills) {
      lines.push(`${g.category ? `${g.category}: ` : ""}${g.items.join(", ")}`);
    }
  }

  if (r.education.length) {
    lines.push("", "FORMAÇÃO");
    for (const ed of r.education) {
      const deg = [ed.degree, ed.field].filter(Boolean).join(" em ");
      const period = [ed.start, ed.end].filter(Boolean).join(" - ");
      lines.push(`${deg ? `${deg} — ` : ""}${ed.institution}${period ? ` (${period})` : ""}`);
    }
  }

  if (r.certifications?.length) {
    lines.push("", "CERTIFICAÇÕES");
    for (const ct of r.certifications) {
      lines.push(`${ct.name}${ct.issuer ? ` — ${ct.issuer}` : ""}${ct.year ? ` (${ct.year})` : ""}`);
    }
  }

  if (r.languages?.length) {
    lines.push("", "IDIOMAS");
    lines.push(r.languages.map((l) => `${l.language}${l.level ? ` (${l.level})` : ""}`).join(", "));
  }

  return lines.join("\n");
}
