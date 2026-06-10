"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Provider } from "@/lib/schema/adapt";

interface Props {
  provider: Provider;
  apiKey: string;
  model: string;
  onProvider: (p: Provider) => void;
  onApiKey: (k: string) => void;
  onModel: (m: string) => void;
}

const PLACEHOLDER: Record<Provider, string> = {
  anthropic: "sk-ant-...",
  openai: "sk-...",
};

export function ApiKeySetup({ provider, apiKey, model, onProvider, onApiKey, onModel }: Props) {
  const [reveal, setReveal] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Provedor de IA (BYOK)</CardTitle>
        <CardDescription>
          Sua chave fica <strong>só no seu navegador</strong> e é usada uma vez por adaptação.
          Nunca a armazenamos nem registramos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Provedor</Label>
          <Select value={provider} onValueChange={(v) => onProvider(v as Provider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="model">Modelo (opcional)</Label>
          <Input
            id="model"
            placeholder={provider === "anthropic" ? "claude-sonnet-4-6" : "gpt-4o"}
            value={model}
            onChange={(e) => onModel(e.target.value)}
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="apiKey">Chave de API</Label>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type={reveal ? "text" : "password"}
              autoComplete="off"
              placeholder={PLACEHOLDER[provider]}
              value={apiKey}
              onChange={(e) => onApiKey(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => setReveal((r) => !r)}>
              {reveal ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
