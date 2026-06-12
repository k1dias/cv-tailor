"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiKeySetup } from "@/components/steps/ApiKeySetup";
import { BaseCvEditor } from "@/components/steps/BaseCvEditor";
import { JobInput } from "@/components/steps/JobInput";
import { ResultView } from "@/components/steps/ResultView";
import { HistoryList } from "@/components/history/HistoryList";
import { ThemeToggle } from "@/components/theme-toggle";
import { loadSettings, saveSettings } from "@/lib/storage/keystore";
import {
  addHistory,
  deleteHistory,
  listHistory,
  type HistoryEntry,
} from "@/lib/storage/db";
import { wipeAllLocalData } from "@/lib/storage/clear";
import { checkGrounding, type GroundingWarning } from "@/lib/grounding";
import type { AdaptResult } from "@/lib/schema/adapt";
import type { OutputLanguage } from "@/lib/schema/adapt";

function guessJobTitle(jobDescription: string): string {
  const firstLine = jobDescription.trim().split("\n")[0] ?? "";
  return firstLine.slice(0, 80);
}

const reveal = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [language, setLanguage] = useState<OutputLanguage>("pt");

  const [baseCvText, setBaseCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdaptResult | null>(null);
  const [warnings, setWarnings] = useState<GroundingWarning[]>([]);
  const [resultKey, setResultKey] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [wipeOpen, setWipeOpen] = useState(false);
  const skipPersist = useRef(false);

  // Carrega config BYOK + histórico ao montar.
  useEffect(() => {
    const s = loadSettings();
    setApiKey(s.apiKey);
    setModel(s.model ?? "");
    setLanguage(s.language);
    listHistory().then(setHistory);
  }, []);

  // Persiste config (a chave fica só no browser). Pula o ciclo pós-wipe
  // para que "Limpar dados" não regrave nada no localStorage.
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    saveSettings({ apiKey, model: model || undefined, language });
  }, [apiKey, model, language]);

  const canSubmit =
    apiKey.trim().length > 0 &&
    baseCvText.trim().length >= 20 &&
    jobDescription.trim().length >= 20;

  async function handleAdapt() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model: model || undefined,
          baseCvText,
          jobDescription,
          language,
          includeCoverLetter,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao adaptar.");
        return;
      }

      const adapted = data as AdaptResult;
      const w = checkGrounding(adapted.adaptedResume, baseCvText);
      setWarnings(w);
      setResult(adapted);
      setResultKey((k) => k + 1);

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        jobTitleGuess: guessJobTitle(jobDescription),
        language,
        hadCoverLetter: includeCoverLetter,
        matchScore: adapted.match.score,
        jobDescription,
        result: adapted,
      };
      await addHistory(entry);
      setHistory(await listHistory());

      if (w.length > 0) {
        toast.warning(`Adaptado, mas ${w.length} item(ns) precisam de verificação.`);
      } else {
        toast.success("Currículo adaptado!");
      }
    } catch {
      toast.error("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen(entry: HistoryEntry) {
    setResult(entry.result);
    // Sem CV base carregado não há contra o que ancorar — não flagar tudo.
    setWarnings(
      baseCvText.trim().length >= 20
        ? checkGrounding(entry.result.adaptedResume, baseCvText)
        : [],
    );
    setResultKey((k) => k + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    await deleteHistory(id);
    setHistory(await listHistory());
    toast.success("Adaptação removida.");
  }

  async function handleWipe() {
    await wipeAllLocalData();
    skipPersist.current = true;
    setApiKey("");
    setModel("");
    setLanguage("pt");
    setBaseCvText("");
    setResult(null);
    setWarnings([]);
    setHistory([]);
    setWipeOpen(false);
    toast.success("Todos os dados locais foram apagados.");
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
      {/* Barra superior */}
      <motion.nav
        {...reveal}
        transition={{ duration: 0.45 }}
        className="flex items-center justify-between py-6"
      >
        <span className="tag-label text-muted-foreground">CV Tailor — ateliê de currículos</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="tag-label h-8 text-muted-foreground hover:text-destructive"
            onClick={() => setWipeOpen(true)}
          >
            Limpar dados
          </Button>
        </div>
      </motion.nav>

      {/* Cabeçalho editorial */}
      <header className="pb-12 pt-10 sm:pt-16">
        <motion.h1
          {...reveal}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="font-display max-w-3xl text-5xl leading-[1.04] tracking-tight sm:text-6xl"
        >
          Seu currículo, <em className="text-thread">sob medida</em> para cada vaga.
        </motion.h1>
        <motion.p
          {...reveal}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Cole seu CV e a descrição da vaga. A IA reorganiza e reescreve o que você já tem —
          otimizado para ATS, com análise de match e carta opcional. Sem inventar nada.
        </motion.p>
        <motion.div
          {...reveal}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {["Sua chave, seu controle", "100% local", "Anti-alucinação"].map((t) => (
            <span key={t} className="tag-label flex items-center gap-2 text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-thread" />
              {t}
            </span>
          ))}
        </motion.div>
      </header>

      <motion.div {...reveal} transition={{ duration: 0.5, delay: 0.3 }} className="stitch mb-12" />

      {/* Etapas costuradas */}
      <ol className="grid">
        <Step n="01" delay={0.35}>
          <ApiKeySetup
            apiKey={apiKey}
            model={model}
            onApiKey={setApiKey}
            onModel={setModel}
          />
        </Step>

        <Step n="02" delay={0.45}>
          <BaseCvEditor
            apiKey={apiKey}
            model={model}
            value={baseCvText}
            onChange={setBaseCvText}
          />
        </Step>

        <Step n="03" delay={0.55} last>
          <JobInput
            jobDescription={jobDescription}
            language={language}
            includeCoverLetter={includeCoverLetter}
            loading={loading}
            canSubmit={canSubmit}
            onJobDescription={setJobDescription}
            onLanguage={setLanguage}
            onIncludeCoverLetter={setIncludeCoverLetter}
            onSubmit={handleAdapt}
          />
        </Step>
      </ol>

      {loading && <ResultSkeleton />}

      {result && !loading && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-16"
        >
          <SectionHeading>Resultado</SectionHeading>
          <ResultView key={resultKey} result={result} warnings={warnings} />
        </motion.section>
      )}

      {history.length > 0 && (
        <section className="mt-16">
          <SectionHeading>Histórico</SectionHeading>
          <HistoryList entries={history} onOpen={handleOpen} onDelete={handleDelete} />
        </section>
      )}

      <footer className="mt-20">
        <div className="stitch mb-6" />
        <p className="tag-label text-center text-muted-foreground/70">
          Feito sob medida — seus dados nunca saem deste navegador
        </p>
      </footer>

      <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Apagar todos os dados locais?
            </DialogTitle>
            <DialogDescription>
              Isso remove sua chave de API, o CV base e todo o histórico deste navegador. Não é
              possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWipeOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleWipe}>
              Apagar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Step({
  n,
  delay,
  last = false,
  children,
}: {
  n: string;
  delay: number;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.li
      {...reveal}
      transition={{ duration: 0.5, delay }}
      className="relative grid gap-4 pb-10 sm:grid-cols-[3rem_1fr] sm:gap-7"
    >
      {!last && (
        <div aria-hidden className="stitch-v absolute bottom-0 left-[1.4rem] top-14 hidden sm:block" />
      )}
      <div
        aria-hidden
        className="hidden h-11 w-11 items-center justify-center rounded-full border border-dashed border-foreground/30 bg-card font-mono text-xs text-muted-foreground sm:flex"
      >
        {n}
      </div>
      <div className="min-w-0">{children}</div>
    </motion.li>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-center gap-5">
      <h2 className="font-display shrink-0 text-3xl tracking-tight">{children}</h2>
      <div className="stitch w-full" />
    </div>
  );
}

function ResultSkeleton() {
  return (
    <section className="mt-16">
      <SectionHeading>
        Alinhavando<span className="animate-pulse">…</span>
      </SectionHeading>
      <Card>
        <CardContent className="grid gap-3 p-6">
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-32 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </section>
  );
}
