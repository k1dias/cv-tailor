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
import type { Provider } from "@/lib/schema/adapt";

interface Props {
  provider: Provider;
  apiKey: string;
  model: string;
  value: string;
  onChange: (rawText: string) => void;
}

export function BaseCvEditor({ provider, apiKey, model, value, onChange }: Props) {
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
          body: JSON.stringify({ provider, apiKey, model: model || undefined, rawText: value }),
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          2. CV base
          {savedAt && !dirty && <Badge variant="secondary">Salvo</Badge>}
          {dirty && <Badge variant="outline">Não salvo</Badge>}
        </CardTitle>
        <CardDescription>
          Cole seu currículo ou importe um PDF. É a <strong>fonte de verdade</strong> — a IA só usa
          o que está aqui.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Textarea
          className="min-h-48"
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
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm">
      <p className="mb-2 font-medium">
        Estrutura detectada{" "}
        <span className="font-normal text-muted-foreground">
          (confirme que nada foi inventado)
        </span>
      </p>
      <ul className="grid gap-1 text-muted-foreground">
        <li>
          <strong>{resume.contact.name}</strong>
        </li>
        <li>{resume.experience.length} experiência(s)</li>
        <li>{resume.skills.reduce((n, g) => n + g.items.length, 0)} skill(s)</li>
        <li>{resume.education.length} formação(ões)</li>
      </ul>
    </div>
  );
}
