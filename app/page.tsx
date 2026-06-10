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
import type { Provider, OutputLanguage } from "@/lib/schema/adapt";

function guessJobTitle(jobDescription: string): string {
  const firstLine = jobDescription.trim().split("\n")[0] ?? "";
  return firstLine.slice(0, 80);
}

export default function Home() {
  const [provider, setProvider] = useState<Provider>("anthropic");
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
    setProvider(s.provider);
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
    saveSettings({ provider, apiKey, model: model || undefined, language });
  }, [provider, apiKey, model, language]);

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
          provider,
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
        provider,
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
    setWarnings(checkGrounding(entry.result.adaptedResume, baseCvText));
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
    setProvider("anthropic");
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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CV Tailor</h1>
          <p className="text-muted-foreground">
            Adapte seu currículo a uma vaga específica com IA — sem inventar nada.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setWipeOpen(true)}>
          Limpar dados
        </Button>
        <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apagar todos os dados locais?</DialogTitle>
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
      </header>

      <div className="grid gap-6">
        <ApiKeySetup
          provider={provider}
          apiKey={apiKey}
          model={model}
          onProvider={setProvider}
          onApiKey={setApiKey}
          onModel={setModel}
        />

        <BaseCvEditor
          provider={provider}
          apiKey={apiKey}
          model={model}
          value={baseCvText}
          onChange={setBaseCvText}
        />

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

        {loading && <ResultSkeleton />}

        {result && !loading && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2"
          >
            <h2 className="mb-4 text-xl font-semibold">Resultado</h2>
            <ResultView key={resultKey} result={result} warnings={warnings} />
          </motion.section>
        )}

        <HistoryList entries={history} onOpen={handleOpen} onDelete={handleDelete} />
      </div>
    </main>
  );
}

function ResultSkeleton() {
  return (
    <Card>
      <CardContent className="grid gap-3 p-6">
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-32 w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
