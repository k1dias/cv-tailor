"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Match } from "@/lib/schema/adapt";

export function MatchPanel({ match }: { match: Match }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Análise de match</span>
          <span className="text-2xl font-bold tabular-nums">{match.score}%</span>
        </CardTitle>
        <Progress value={match.score} className="mt-2" />
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <section>
          <h4 className="mb-1 font-semibold text-emerald-600 dark:text-emerald-400">
            Requisitos atendidos ({match.metRequirements.length})
          </h4>
          <ul className="grid gap-1.5">
            {match.metRequirements.map((r, i) => (
              <li key={i}>
                <span className="font-medium">{r.requirement}</span>
                <span className="block text-xs text-muted-foreground">↳ {r.evidence}</span>
              </li>
            ))}
          </ul>
        </section>

        {match.gaps.length > 0 && (
          <section>
            <h4 className="mb-1 font-semibold text-amber-600 dark:text-amber-400">
              Gaps ({match.gaps.length})
            </h4>
            <ul className="grid gap-1.5">
              {match.gaps.map((g, i) => (
                <li key={i}>
                  <span className="font-medium">{g.requirement}</span>
                  {g.suggestion && (
                    <span className="block text-xs text-muted-foreground">↳ {g.suggestion}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {match.keywords.length > 0 && (
          <section>
            <h4 className="mb-2 font-semibold">Palavras-chave incorporadas</h4>
            <div className="flex flex-wrap gap-1">
              {match.keywords.map((k, i) => (
                <Badge key={i} variant="outline">
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
