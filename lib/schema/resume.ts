import { z } from "zod";

/**
 * ResumeSchema — representação estruturada de um currículo.
 * É o mesmo formato usado tanto para o CV base (fonte de verdade) quanto
 * para o CV adaptado retornado pela IA. Campos opcionais são marcados
 * para tolerar currículos incompletos.
 */

export const LinkSchema = z.object({
  label: z.string().describe("Texto do link, ex: 'LinkedIn', 'GitHub', 'Portfólio'"),
  url: z.string().describe("URL completa"),
});

export const ExperienceSchema = z.object({
  company: z.string().describe("Nome da empresa. NUNCA inventar."),
  title: z.string().describe("Cargo ocupado. NUNCA inventar."),
  location: z.string().optional().describe("Cidade/país ou 'Remoto'"),
  start: z.string().describe("Início, ex: 'Jan 2021'"),
  end: z.string().optional().describe("Fim, ex: 'Dez 2023'. Omitir se atual."),
  current: z.boolean().describe("true se é o emprego atual"),
  bullets: z
    .array(z.string())
    .describe("Realizações/responsabilidades. Reescrever com base no original, sem inventar."),
});

export const SkillGroupSchema = z.object({
  category: z.string().optional().describe("Categoria, ex: 'Linguagens', 'Ferramentas'"),
  items: z.array(z.string()).describe("Skills. Apenas as que existem no CV base."),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional().describe("Ex: 'Bacharelado'"),
  field: z.string().optional().describe("Área de estudo"),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  year: z.string().optional(),
});

export const LanguageSchema = z.object({
  language: z.string(),
  level: z.string().optional().describe("Ex: 'Nativo', 'Fluente', 'Intermediário'"),
});

export const ContactSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(LinkSchema).describe("Links profissionais. [] se nenhum."),
});

export const ResumeSchema = z.object({
  contact: ContactSchema,
  summary: z.string().describe("Resumo profissional de 2-4 frases."),
  experience: z.array(ExperienceSchema).describe("Experiências, ordenáveis por relevância."),
  skills: z.array(SkillGroupSchema),
  education: z.array(EducationSchema),
  certifications: z.array(CertificationSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
