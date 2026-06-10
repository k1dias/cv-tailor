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
    <Card>
      <CardHeader>
        <CardTitle>3. Vaga & opções</CardTitle>
        <CardDescription>Cole a descrição da vaga e escolha a saída.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="job">Descrição da vaga</Label>
          <Textarea
            id="job"
            className="min-h-40"
            placeholder="Cole aqui a descrição completa da vaga..."
            value={jobDescription}
            onChange={(e) => onJobDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="grid gap-2">
            <Label>Idioma de saída</Label>
            <Select value={language} onValueChange={(v) => onLanguage(v as OutputLanguage)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Switch
              id="cover"
              checked={includeCoverLetter}
              onCheckedChange={onIncludeCoverLetter}
            />
            <Label htmlFor="cover">Gerar carta de apresentação</Label>
          </div>
        </div>

        <Button size="lg" disabled={!canSubmit || loading} onClick={onSubmit}>
          {loading ? "Adaptando..." : "Adaptar currículo"}
        </Button>
      </CardContent>
    </Card>
  );
}
