"use client";

import { Button } from "@/components/ui/button";
import type { HistoryEntry } from "@/lib/storage/db";

interface Props {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ entries, onOpen, onDelete }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="tag-label mb-1 text-muted-foreground">
        {entries.length} adaptação(ões) guardada(s) neste navegador
      </p>
      {entries.map((e) => (
        <div
          key={e.id}
          className="group flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 shadow-xs transition-colors hover:border-foreground/25"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{e.jobTitleGuess || "Vaga sem título"}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {new Date(e.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · Gemini · {e.language.toUpperCase()}
              {e.hadCoverLetter ? " · carta" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl tabular-nums text-thread">
              {e.matchScore}
              <span className="text-base text-thread/60">%</span>
            </span>
            <Button size="sm" variant="outline" onClick={() => onOpen(e)}>
              Abrir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(e.id)}
            >
              Excluir
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
