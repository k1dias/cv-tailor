"use client";

import { useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  apiKey: string;
  model: string;
  onApiKey: (k: string) => void;
  onModel: (m: string) => void;
}

const KEY_URL = "https://aistudio.google.com/app/apikey";

export function ApiKeySetup({ apiKey, model, onApiKey, onModel }: Props) {
  const [reveal, setReveal] = useState(false);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-tight">Chave do Google Gemini</CardTitle>
        <CardDescription className="leading-relaxed">
          Use sua própria chave do Gemini —{" "}
          <strong className="text-foreground">grátis, sem cartão</strong>. Ela fica{" "}
          <strong className="text-foreground">só no seu navegador</strong> e é usada uma vez por
          adaptação. Nunca a armazenamos nem registramos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="apiKey" className="tag-label text-muted-foreground">
            Chave de API
          </Label>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type={reveal ? "text" : "password"}
              autoComplete="off"
              className="bg-background/60 font-mono text-sm"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => onApiKey(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => setReveal((r) => !r)}>
              {reveal ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          <a
            href={KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tag-label inline-flex w-fit items-center gap-1.5 text-thread hover:underline"
          >
            Pegar chave grátis no Google AI Studio
            <ExternalLinkIcon className="size-3" />
          </a>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="model" className="tag-label text-muted-foreground">
            Modelo <span className="normal-case tracking-normal opacity-60">(opcional)</span>
          </Label>
          <Input
            id="model"
            className="bg-background/60 font-mono text-sm"
            placeholder="gemini-2.0-flash"
            value={model}
            onChange={(e) => onModel(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
