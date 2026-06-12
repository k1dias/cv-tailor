# CV Tailor

🇧🇷 Português (abaixo) · 🇺🇸 [English](#english)

Adapte seu currículo a vagas específicas com IA — **sem inventar nada**. Cole seu CV (ou importe um PDF) e a descrição da vaga: receba um CV otimizado para ATS, análise de match com gaps e carta de apresentação opcional, com export em PDF.

**BYOK (bring your own key):** o usuário usa a própria chave do **Google Gemini** — grátis, sem cartão ([Google AI Studio](https://aistudio.google.com/app/apikey)). A chave fica no navegador e o app não tem custo de IA nem armazena dados de usuários.

---

## Sumário

- [Como funciona](#como-funciona)
- [Stack](#stack)
- [Rodando o projeto](#rodando-o-projeto)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Modelo de dados](#modelo-de-dados)
- [Rotas de API](#rotas-de-api)
- [Invariantes de segurança (BYOK)](#invariantes-de-segurança-byok)
- [Anti-alucinação](#anti-alucinação)
- [Pegadinhas conhecidas](#pegadinhas-conhecidas)
- [O que está testado](#o-que-está-testado)
- [Fora do escopo / roadmap](#fora-do-escopo--roadmap)

## Como funciona

1. **Setup:** o usuário cola a própria chave do Google Gemini (grátis no [AI Studio](https://aistudio.google.com/app/apikey), sem cartão). Modelo default `gemini-2.0-flash`, sobrescrevível.
2. **CV base:** cola o currículo em texto ou importa um PDF (extração client-side). Opcionalmente "estrutura" o CV via IA num JSON revisável — esse CV é a **fonte de verdade**.
3. **Adaptação:** cola a descrição da vaga, escolhe idioma (PT/EN) e se quer carta. O backend chama a IA com saída **forçada a um schema Zod** e retorna: CV adaptado + análise de match (score, requisitos atendidos com evidência, gaps, keywords) + carta opcional.
4. **Resultado:** template limpo ATS-friendly, editor inline campo a campo, export em **2 PDFs separados** (CV e carta) via diálogo de impressão.
5. **Histórico:** cada adaptação fica salva localmente (IndexedDB) e pode ser reaberta/excluída.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 15.5** (App Router) — versão fixada de propósito, não subir para 16 sem decisão explícita |
| UI | React 19, Tailwind 4, shadcn/ui (**base-ui**, não Radix), Framer Motion |
| IA | Vercel **AI SDK v6** (`ai`, `@ai-sdk/google`) com `generateObject` — Google Gemini (default `gemini-2.0-flash`) |
| Validação | **Zod v4** (schemas compartilhados entre front e back) |
| Persistência | **IndexedDB** via `idb` + `localStorage` (100% local-first, sem banco de usuários) |
| PDF | `pdfjs-dist` (import) e `react-to-print` v3 (export) |
| Deploy | Vercel (front + serverless functions no mesmo deploy) |

Requisitos: **Node 20+**, npm.

## Rodando o projeto

```bash
npm install      # roda postinstall: copia o worker do pdfjs para /public
npm run dev      # http://localhost:3000 (predev copia o worker também)
npm run build    # build de produção (prebuild idem)
npx tsc --noEmit # typecheck
```

Não há `.env` obrigatório — o app inteiro funciona sem variáveis de ambiente (a chave de IA é do usuário, por requisição).

## Arquitetura

Monorepo fullstack Next.js — front e back no mesmo deploy:

```
Browser (localStorage: chave · IndexedDB: CV base + histórico)
   │  POST /api/adapt    { apiKey, baseCvText, jobDescription, language, includeCoverLetter }
   │  POST /api/structure { apiKey, rawText }
   ▼
Route Handlers (runtime Node, force-dynamic, sem cache)
   │  Vercel AI SDK → generateObject(schema Zod)
   ▼
Google Gemini → JSON validado → resposta
```

- O backend é um **proxy fino**: instancia o Gemini com a chave recebida (`lib/ai/providers.ts`), faz **uma** chamada e descarta a chave. Não há sessão, banco nem estado no servidor.
- Todo dado do usuário (chave, CV, histórico) vive **apenas no browser**.
- A validação Zod roda nas duas pontas com os mesmos schemas (`lib/schema/`).

## Estrutura de pastas

```
app/
├─ page.tsx                  # orquestrador: estado global das etapas + histórico + wipe
├─ layout.tsx                # Toaster (sonner), metadata
└─ api/
   ├─ adapt/route.ts         # adaptação CV→vaga
   └─ structure/route.ts     # texto cru → Resume estruturado
components/
├─ steps/                    # ApiKeySetup · BaseCvEditor · CvPdfImport · JobInput · ResultView
├─ resume/                   # ResumeTemplate (imprimível) · ResumeEditor (inline) · CoverLetterTemplate
├─ match/MatchPanel.tsx      # score, requisitos, gaps, keywords
├─ history/HistoryList.tsx
└─ ui/                       # shadcn (gerados — evite editar à mão)
lib/
├─ ai/                       # providers.ts (resolve modelo) · prompt.ts (regras) · adapt.ts · structure.ts
├─ schema/                   # resume.ts (ResumeSchema) · adapt.ts (AdaptRequest/AdaptResult)
├─ storage/                  # db.ts (IndexedDB) · keystore.ts (localStorage) · clear.ts (wipe)
├─ grounding.ts              # checagem anti-alucinação pós-geração
├─ pdf-import.ts             # pdfjs (import dinâmico — ver Pegadinhas)
├─ resume-text.ts            # Resume estruturado → texto plano
└─ api-error.ts              # sanitização de erros do provider
scripts/copy-pdf-worker.mjs  # copia worker do pdfjs p/ /public (pre dev/build/install)
PLAN.md                      # plano original do projeto (decisões e fases)
```

## Modelo de dados

**localStorage** (chaves `cvt.*`): `apiKey`, `model` (opcional), `language`. Nunca gravar chave vazia (ver `keystore.ts`).

**IndexedDB** (banco `cv-tailor`, v1):
- `kv` → registro `baseCv`: `{ rawText, structured?: Resume, updatedAt }`
- `history` → `{ id, createdAt, jobTitleGuess, language, hadCoverLetter, matchScore, jobDescription, result: AdaptResult }`, índice `by-createdAt`

**Schemas Zod principais** (`lib/schema/`):
- `ResumeSchema`: contact, summary, experience[], skills[], education[], certifications?, languages?
- `AdaptResult`: `{ adaptedResume: Resume, match: { score 0-100, metRequirements[{requirement, evidence}], gaps[{requirement, suggestion?}], keywords[] }, coverLetter? }`

Migração de schema do IndexedDB: incremente `DB_VERSION` em `lib/storage/db.ts` e trate no `upgrade()`.

## Rotas de API

Ambas: `runtime = "nodejs"`, `dynamic = "force-dynamic"`, entrada validada com `safeParse`, erros sanitizados por `lib/api-error.ts` (401 chave inválida · 429 rate limit · 402 sem créditos · 400 validação · 502 genérico). **Nunca logar o corpo da requisição** (contém chave + PII).

| Rota | Entrada | Saída |
|---|---|---|
| `POST /api/adapt` | `AdaptRequestSchema` | `AdaptResult` (JSON) |
| `POST /api/structure` | `StructureRequestSchema` | `Resume` (JSON) |

## Invariantes de segurança (BYOK)

Regras **inegociáveis** — qualquer PR deve preservá-las:

1. A chave do usuário trafega **só no body** de cada requisição, é usada para instanciar o provider e **descartada** com o escopo. Nunca persistir (memória global, cache, banco, log).
2. **Nunca** logar request body nem ecoar a chave em mensagens de erro (ver `sanitizeProviderError`).
3. Sem cache nas rotas de API.
4. "Limpar dados" (`lib/storage/clear.ts`) apaga chave + IndexedDB e **não pode deixar rastro** — o effect de persistência em `page.tsx` pula um ciclo pós-wipe (`skipPersist`); `saveSettings` não grava chave vazia.
5. Se algum dia adicionar telemetria (Fase 7 do PLAN.md): **zero PII** — sem CV, sem vaga, sem chave.

## Anti-alucinação

Três camadas para garantir que a IA **só reorganiza/reescreve o que existe** no CV base:

1. **Schema forçado:** `generateObject` com Zod — sem parsing frágil; `temperature` 0.2 (adaptação) / 0 (estruturação).
2. **System prompt restritivo** (`lib/ai/prompt.ts`): proíbe inventar empresa/cargo/skill/certificação; requisitos sem evidência devem virar `match.gaps`, nunca experiência.
3. **Grounding check pós-geração** (`lib/grounding.ts`): confere que empresas, cargos, skills e certificações do CV adaptado têm ancoragem (token match normalizado, sem acentos) no texto do CV base. Itens órfãos viram aviso âmbar no `ResultView`. É deliberadamente **leniente** (um token basta) para não punir reescritas legítimas.

## Pegadinhas conhecidas

- **pdfjs + Turbopack/SSR:** `pdfjs-dist` referencia `DOMMatrix` (browser-only) no load do módulo → **só importe dinamicamente** (`await import("pdfjs-dist")` dentro da função, como em `pdf-import.ts`). O worker não pode usar `new URL(..., import.meta.url)` (Turbopack não suporta) → é servido de `/public/pdf.worker.min.mjs`, copiado por `scripts/copy-pdf-worker.mjs` nos hooks `predev`/`prebuild`/`postinstall`. **A versão do worker deve bater com a do pacote** — não atualize `pdfjs-dist` sem reexecutar o script.
- **shadcn/ui usa base-ui, não Radix:** componentes como `Dialog` **não têm `asChild`**. Controle por estado (`open`/`onOpenChange`), como no dialog de "Limpar dados" em `page.tsx`.
- **PDF escaneado:** sem OCR no MVP. `extractPdfText` lança `ScannedPdfError` quando não há camada de texto; a UI orienta colar manualmente.
- **react-to-print v3:** API é `useReactToPrint({ contentRef })`. Os nós imprimíveis ficam montados fora da tela (offscreen) no `ResultView`.
- **Next fixado em 15.x:** decisão de projeto. `create-next-app@latest` instala 16 — não use para regenerar nada.

## O que está testado

Sem suíte automatizada ainda (candidato a melhoria). Verificação feita manualmente/via script:

- Matriz de erros das duas rotas (validação 400, chave falsa 401, sem vazamento de chave nas respostas).
- Import de PDF real (extração via pdfjs), persistência IndexedDB (salvar → reload → repovoa), histórico (render/abrir/excluir), grounding check (flagueia itens fabricados, ignora reais), "Limpar dados" (zero rastro).
- `tsc --noEmit` e `next build` limpos.

**Não testável sem chave real:** o caminho de sucesso da geração (BYOK). Teste com sua chave antes de releases.

## Fora do escopo / roadmap

Fora do MVP (decisão registrada em `PLAN.md`): login/multiusuário, múltiplos templates, scraping de URL de vaga, billing, OCR. O app usa **apenas o Google Gemini** (BYOK) — Claude/OpenAI foram removidos por exigirem cartão/créditos pré-pagos, inviável para o público-alvo. Fase 7 opcional não construída: métricas anônimas (Drizzle + Neon).

---

<a name="english"></a>

# CV Tailor (English)

Tailor your resume to specific job postings with AI — **without fabricating anything**. Paste your resume (or import a PDF) plus the job description and get an ATS-optimized resume, a match analysis with gaps, and an optional cover letter, exportable to PDF.

**BYOK (bring your own key):** users provide their own **Google Gemini** key — free, no credit card ([Google AI Studio](https://aistudio.google.com/app/apikey)). The key lives in the browser; the app has zero AI cost and stores no user data server-side.

## How it works

1. **Setup:** paste your Google Gemini key (free at the [AI Studio](https://aistudio.google.com/app/apikey), no credit card). Default model `gemini-2.0-flash`, overridable.
2. **Base resume:** paste text or import a PDF (client-side extraction). Optionally "structure" it via AI into a reviewable JSON — this resume is the **source of truth**.
3. **Adaptation:** paste the job description, pick output language (PT/EN) and cover-letter toggle. The backend calls the AI with output **forced to a Zod schema** and returns: adapted resume + match analysis (score, met requirements with evidence, gaps, keywords) + optional letter.
4. **Result:** clean ATS-friendly template, inline field-by-field editor, export as **2 separate PDFs** (resume and letter) via the print dialog.
5. **History:** every adaptation is stored locally (IndexedDB) and can be reopened/deleted.

## Stack & requirements

Next.js **15.5** (App Router — intentionally pinned, don't bump to 16 without an explicit decision), React 19, Tailwind 4, shadcn/ui (**base-ui**, not Radix), Framer Motion, Vercel **AI SDK v6** (`generateObject`, `@ai-sdk/google` — Google Gemini), **Zod v4**, `idb` (IndexedDB), `pdfjs-dist`, `react-to-print` v3. Deploys to Vercel. Requires **Node 20+**.

```bash
npm install      # postinstall copies the pdfjs worker into /public
npm run dev      # http://localhost:3000
npm run build
npx tsc --noEmit
```

No required `.env` — the AI key is user-provided per request.

## Architecture

Fullstack Next.js monorepo — frontend and backend ship in one deploy:

- **Frontend:** `app/page.tsx` orchestrates the steps; `components/steps|resume|match|history`; all user data (key in `localStorage` under `cvt.*`, base resume + history in IndexedDB db `cv-tailor`) lives **browser-only**.
- **Backend:** two thin route handlers — `POST /api/adapt` and `POST /api/structure` (`lib/ai/` instantiates Gemini via `providers.ts`). Node runtime, `force-dynamic`, no cache, no server state.
- **Shared:** Zod schemas in `lib/schema/` validate on both ends. Errors are sanitized by `lib/api-error.ts` (401 invalid key · 429 rate limit · 402 quota · 400 validation · 502 generic).

## Security invariants (BYOK) — non-negotiable

1. The user's key travels **only in the request body**, is used to instantiate Gemini once, and is discarded. Never persist it (global memory, cache, DB, logs).
2. **Never** log request bodies or echo the key in error messages.
3. No caching on API routes.
4. "Clear data" (`lib/storage/clear.ts`) wipes key + IndexedDB and must leave **zero trace** — the persistence effect in `page.tsx` skips one cycle post-wipe (`skipPersist`); `saveSettings` never writes an empty key.
5. If telemetry is ever added: **zero PII** — no resume, no job text, no key.

## Anti-hallucination (three layers)

1. **Forced schema:** `generateObject` + Zod; low temperature (0.2 adapt / 0 structure).
2. **Restrictive system prompt** (`lib/ai/prompt.ts`): forbids inventing companies/titles/skills/certs; unmet requirements must go to `match.gaps`, never become fake experience.
3. **Post-generation grounding check** (`lib/grounding.ts`): verifies every company, title, skill and certification in the adapted resume is anchored (normalized token match) in the base resume text; orphans render as an amber warning in `ResultView`. Deliberately lenient to avoid punishing legitimate rewrites.

## Known gotchas

- **pdfjs + Turbopack/SSR:** `pdfjs-dist` touches `DOMMatrix` at module load → only **dynamic-import** it inside functions (see `lib/pdf-import.ts`). The worker can't use `new URL(..., import.meta.url)` under Turbopack → it's served from `/public/pdf.worker.min.mjs`, copied by `scripts/copy-pdf-worker.mjs` (`predev`/`prebuild`/`postinstall`). Worker version must match the package — rerun the script after upgrading `pdfjs-dist`.
- **shadcn/ui is base-ui, not Radix:** no `asChild`. Control dialogs via `open`/`onOpenChange` (see the wipe dialog in `page.tsx`).
- **Scanned PDFs:** no OCR in the MVP; `extractPdfText` throws `ScannedPdfError` and the UI asks for pasted text.
- **react-to-print v3:** API is `useReactToPrint({ contentRef })`; printable nodes stay mounted offscreen in `ResultView`.

## Testing status

No automated suite yet (good first improvement). Manually verified: API error matrix for both routes (validation 400s, fake-key 401s, no key leakage), real PDF import, IndexedDB persistence across reloads, history flow, grounding check (flags fabricated items, stays silent on real ones), zero-trace wipe, clean `tsc` and production build. **The AI success path requires a real key (BYOK)** — test with yours before releases.

## Out of scope / roadmap

Per `PLAN.md`: no auth/multi-user, single template only, no job-URL scraping, no billing, no OCR. The app uses **Google Gemini only** (BYOK) — Claude/OpenAI were removed because they require a card / prepaid credits, unworkable for the target audience. Optional Phase 7 (anonymous metrics via Drizzle + Neon) was intentionally not built.