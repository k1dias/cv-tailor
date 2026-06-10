"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HistoryEntry } from "@/lib/storage/db";

interface Props {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ entries, onOpen, onDelete }: Props) {
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico</CardTitle>
        <CardDescription>
          Suas adaptações ficam salvas neste navegador ({entries.length}).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{e.jobTitleGuess || "Vaga sem título"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleString("pt-BR")} ·{" "}
                {e.provider === "anthropic" ? "Claude" : "OpenAI"} · {e.language.toUpperCase()}
                {e.hadCoverLetter ? " · com carta" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="tabular-nums">
                {e.matchScore}%
              </Badge>
              <Button size="sm" variant="outline" onClick={() => onOpen(e)}>
                Abrir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => onDelete(e.id)}
              >
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
