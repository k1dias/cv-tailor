"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/schema/adapt";

export function MatchPanel({ match }: { match: Match }) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-2">
        <p className="tag-label text-muted-foreground">Análise de match</p>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-6xl tracking-tight text-thread">{match.score}</span>
          <span className="font-display text-2xl text-thread/60">%</span>
          <span className="ml-auto pb-1 text-sm text-muted-foreground">de aderência</span>
        </div>
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-thread transition-[width] duration-700"
            style={{ width: `${match.score}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-4 text-sm">
        <section>
          <h4 className="tag-label mb-2.5 text-thread">
            Atendidos · {match.metRequirements.length}
          </h4>
          <ul className="grid gap-2.5">
            {match.metRequirements.map((r, i) => (
              <li key={i} className="grid gap-0.5 border-l-2 border-thread/30 pl-3">
                <span className="font-medium leading-snug">{r.requirement}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">{r.evidence}</span>
              </li>
            ))}
          </ul>
        </section>

        {match.gaps.length > 0 && (
          <section>
            <h4 className="tag-label mb-2.5 text-brass">Gaps · {match.gaps.length}</h4>
            <ul className="grid gap-2.5">
              {match.gaps.map((g, i) => (
                <li key={i} className="grid gap-0.5 border-l-2 border-brass/40 pl-3">
                  <span className="font-medium leading-snug">{g.requirement}</span>
                  {g.suggestion && (
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {g.suggestion}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {match.keywords.length > 0 && (
          <section>
            <h4 className="tag-label mb-2.5 text-muted-foreground">Palavras-chave incorporadas</h4>
            <div className="flex flex-wrap gap-1.5">
              {match.keywords.map((k, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-dashed font-mono text-[11px] font-normal text-muted-foreground"
                >
                  {k}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
