"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OutputLanguage } from "@/lib/schema/adapt";

interface Props {
  jobDescription: string;
  language: OutputLanguage;
  includeCoverLetter: boolean;
  loading: boolean;
  canSubmit: boolean;
  onJobDescription: (v: string) => void;
  onLanguage: (v: OutputLanguage) => void;
  onIncludeCoverLetter: (v: boolean) => void;
  onSubmit: () => void;
}

export function JobInput({
  jobDescription,
  language,
  includeCoverLetter,
  loading,
  canSubmit,
  onJobDescription,
  onLanguage,
  onIncludeCoverLetter,
  onSubmit,
}: Props) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-tight">Vaga & opções</CardTitle>
        <CardDescription className="leading-relaxed">
          Cole a descrição da vaga e escolha como quer a saída.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="job" className="tag-label text-muted-foreground">
            Descrição da vaga
          </Label>
          <Textarea
            id="job"
            className="min-h-40 bg-background/60 leading-relaxed"
            placeholder="Cole aqui a descrição completa da vaga..."
            value={jobDescription}
            onChange={(e) => onJobDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="grid gap-2">
            <Label className="tag-label text-muted-foreground">Idioma de saída</Label>
            <Select value={language} onValueChange={(v) => onLanguage(v as OutputLanguage)}>
              <SelectTrigger className="w-40 bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2.5 pb-2">
            <Switch
              id="cover"
              checked={includeCoverLetter}
              onCheckedChange={onIncludeCoverLetter}
            />
            <Label htmlFor="cover" className="cursor-pointer">
              Gerar carta de apresentação
            </Label>
          </div>
        </div>

        <div className="stitch" />

        <Button
          size="lg"
          disabled={!canSubmit || loading}
          onClick={onSubmit}
          className="group h-13 w-full text-base transition-all hover:shadow-[0_8px_24px_-8px_oklch(0.282_0.015_60/45%)] sm:w-auto sm:min-w-72 sm:justify-self-end"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Alinhavando seu currículo…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Adaptar currículo
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
