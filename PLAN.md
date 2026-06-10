# Plano — CV Tailor (adaptador de currículos com IA, BYOK)

## Context

Ferramenta web onde o usuário cola o **CV base** + a **descrição de uma vaga** e a IA gera: (1) CV adaptado e otimizado para ATS, (2) análise de match (% de aderência, requisitos atendidos, gaps) e (3) carta de apresentação opcional. Modelo **BYOK** — o usuário traz a própria chave (Claude ou OpenAI), eliminando custo de IA para o operador.

O problema que resolve: adaptar currículo para cada vaga é manual, lento e propenso a omitir palavras-chave que ATS filtram. A ferramenta automatiza a reorganização/reescrita **sem inventar nada** que não esteja no CV base.

Stack instalada: **Next.js 15.5 (App Router) + React 19 + TypeScript + Tailwind 4 + shadcn/ui**. AI SDK v6 (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`), Zod v4, `idb`, `react-to-print`, `pdfjs-dist`, `framer-motion`.

### Decisões travadas
1. **Persistência:** *Tudo local.* CV base + histórico vivem no browser (IndexedDB). Postgres guarda apenas métricas anônimas opcionais (Fase 7, cortável).
2. **Export PDF:** dois PDFs separados — CV adaptado e, se gerada, a carta.
3. **Formato da IA:** JSON estruturado por seções, validado por Zod.
4. **UX de geração:** request único + loading (skeleton), validação Zod de uma vez.
5. **Import de CV em PDF** (além de texto) via `pdfjs-dist` client-side; PDF escaneado sem texto = fora do MVP.
6. **Carta condicional** ao toggle `includeCoverLetter`.
7. **Botão "Limpar dados"**: apaga a chave (`localStorage`) e todo o IndexedDB.

---

## Arquitetura

- **Front:** página única com etapas (Setup → CV base → Vaga/Opções → Resultado). Dados persistentes em IndexedDB via `idb`.
- **Back:** Route Handler `POST /api/adapt` (runtime Node). Recebe `{ provider, apiKey, baseCv, jobDescription, language, includeCoverLetter }`, chama provider via AI SDK `generateObject` (saída forçada ao schema Zod), valida, devolve JSON. Chave usada **uma vez** e descartada; nunca persistida/logada.
- **PDF:** `react-to-print` para CV e carta separados.

## Estrutura de pastas

```
cv-tailor/
├─ app/
│  ├─ layout.tsx · page.tsx · globals.css
│  └─ api/adapt/route.ts · api/metrics/route.ts (opcional)
├─ components/
│  ├─ steps/ ApiKeySetup · BaseCvEditor · CvPdfImport · JobInput · ResultView
│  ├─ resume/ ResumeTemplate · ResumeEditor · CoverLetterTemplate
│  ├─ match/MatchPanel · history/HistoryList
│  └─ ui/ (shadcn)
├─ lib/
│  ├─ ai/ providers · prompt · adapt
│  ├─ schema/ resume · adapt
│  ├─ storage/ db · keystore · clear
│  ├─ pdf-import.ts · grounding.ts · pdf.ts
└─ db/ (opcional, drizzle)
```

## Modelo de dados (resumo)

- **IndexedDB:** `settings`, `baseCv` (ResumeSchema + rawText), `history`. Chave da API em `localStorage`.
- **ResumeSchema (Zod):** contact, summary, experience[], skills[], education[], certifications?[], languages?[].
- **AdaptResult (Zod):** `adaptedResume: ResumeSchema`, `match { score, metRequirements[], gaps[], keywords[] }`, `coverLetter?`.

## Anti-alucinação
`generateObject` + system prompt restritivo (jamais inventar empresa/cargo/skill ausente; gaps listados honestamente) + **grounding check** pós-geração (`lib/grounding.ts`) que confere que todo item do CV adaptado existe no CV base + temperature baixa.

## Segurança BYOK
Chave no body por requisição, usada uma vez e descartada; nunca logar request body; `runtime='nodejs'`, sem cache de rota; erros do provider repassados sem ecoar a chave; botão "Limpar dados".

## Fases de build
0. **Bootstrap** ✅ — Next 15 + Tailwind + shadcn + libs.
1. **Caminho feliz fim-a-fim** — schemas, lib/ai, /api/adapt, ApiKeySetup + JobInput + ResultView.
2. **CV base + estruturação + import PDF** — BaseCvEditor, pdfjs-dist, IndexedDB.
3. **UI de resultado** — ResumeTemplate, MatchPanel, CoverLetterTemplate, ResumeEditor.
4. **Export PDF** — react-to-print (2 PDFs).
5. **Histórico** — HistoryList (IndexedDB).
6. **Guardrails + polish** — grounding check, Limpar dados, Framer Motion, erros/loading.
7. **(Opcional) Métricas** — Drizzle + Neon.

## Riscos
Alucinação (mitigado por schema + grounding check); vazamento de chave (uso único, sem log); JSON inválido/drift entre providers (generateObject + retry; testar Claude e OpenAI); PDF escaneado/multi-coluna (sem OCR no MVP; estruturação por IA normaliza).

## Verificação (end-to-end)
`npm run dev` sobe limpo → setup com chave (Claude e OpenAI) + CV por texto e PDF → adaptar PT/EN com/sem carta → AdaptResult válido, chave só na request → anti-alucinação (skill ausente vira gap, não experiência) → editar + exportar 2 PDFs → histórico persiste no reload → "Limpar dados" zera tudo.
