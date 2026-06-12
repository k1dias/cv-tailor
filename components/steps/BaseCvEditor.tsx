"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CvPdfImport } from "./CvPdfImport";
import { getBaseCv, saveBaseCv } from "@/lib/storage/db";
import type { Resume } from "@/lib/schema/resume";

interface Props {
  apiKey: string;
  model: string;
  value: string;
  onChange: (rawText: string) => void;
}

export function BaseCvEditor({ apiKey, model, value, onChange }: Props) {
  const [structured, setStructured] = useState<Resume | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [structuring, setStructuring] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Carrega CV base persistido ao montar.
  useEffect(() => {
    let alive = true;
    getBaseCv().then((cv) => {
      if (!alive || !cv) return;
      onChange(cv.rawText);
      setStructured(cv.structured ?? null);
      setSavedAt(cv.updatedAt);
      setDirty(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(text: string) {
    onChange(text);
    setDirty(true);
  }

  async function handleSave(withStructure: boolean) {
    if (value.trim().length < 20) {
      toast.error("Cole um currículo válido primeiro.");
      return;
    }
    let nextStructured = structured ?? undefined;

    if (withStructure) {
      if (!apiKey.trim()) {
        toast.error("Informe sua chave de API para estruturar.");
        return;
      }
      setStructuring(true);
      try {
        const res = await fetch("/api/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, model: model || undefined, rawText: value }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Falha ao estruturar.");
          setStructuring(false);
          return;
        }
        nextStructured = data as Resume;
        setStructured(nextStructured);
      } catch {
        toast.error("Erro de rede ao estruturar.");
        setStructuring(false);
        return;
      } finally {
        setStructuring(false);
      }
    }

    await saveBaseCv({ rawText: value, structured: nextStructured });
    setSavedAt(Date.now());
    setDirty(false);
    toast.success(withStructure ? "CV base estruturado e salvo." : "CV base salvo.");
  }

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-3 text-2xl tracking-tight">
          CV base
          {savedAt && !dirty && (
            <Badge className="bg-thread-soft font-sans text-thread" variant="secondary">
              Salvo
            </Badge>
          )}
          {dirty && (
            <Badge variant="outline" className="font-sans text-muted-foreground">
              Não salvo
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Cole seu currículo ou importe um PDF. É a{" "}
          <strong className="text-foreground">fonte de verdade</strong> — a IA só usa o que está
          aqui.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Textarea
          className="min-h-48 bg-background/60 leading-relaxed"
          placeholder="Cole aqui seu currículo completo..."
          value={value}
          onChange={(e) => update(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <CvPdfImport onExtracted={update} />
          <Button type="button" variant="secondary" onClick={() => handleSave(false)}>
            Salvar
          </Button>
          <Button type="button" onClick={() => handleSave(true)} disabled={structuring}>
            {structuring ? "Estruturando..." : "Estruturar e salvar"}
          </Button>
        </div>

        {structured && <StructuredPreview resume={structured} />}
      </CardContent>
    </Card>
  );
}

function StructuredPreview({ resume }: { resume: Resume }) {
  const skillCount = resume.skills.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="rounded-md border border-dashed border-thread/40 bg-thread-soft/40 p-4 text-sm">
      <p className="tag-label mb-3 text-thread">
        Estrutura detectada — confirme que nada foi inventado
      </p>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="font-display text-lg">{resume.contact.name}</span>
        <span className="text-muted-foreground">
          {resume.experience.length} experiência(s) · {skillCount} skill(s) ·{" "}
          {resume.education.length} formação(ões)
        </span>
      </div>
    </div>
  );
}
