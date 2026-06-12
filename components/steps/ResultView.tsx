"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResumeTemplate } from "@/components/resume/ResumeTemplate";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { CoverLetterTemplate } from "@/components/resume/CoverLetterTemplate";
import { MatchPanel } from "@/components/match/MatchPanel";
import type { AdaptResult } from "@/lib/schema/adapt";
import type { Resume } from "@/lib/schema/resume";
import type { GroundingWarning } from "@/lib/grounding";

const PAGE_STYLE = `@page { size: A4; margin: 12mm; } @media print { body { -webkit-print-color-adjust: exact; } }`;

/** Remove bullets/skills vazios antes de exibir no template ou exportar. */
function cleanResume(r: Resume): Resume {
  return {
    ...r,
    experience: r.experience.map((e) => ({
      ...e,
      bullets: e.bullets.map((b) => b.trim()).filter(Boolean),
    })),
    skills: r.skills.filter((g) => g.items.length > 0),
  };
}

export function ResultView({
  result,
  warnings = [],
}: {
  result: AdaptResult;
  warnings?: GroundingWarning[];
}) {
  const [resume, setResume] = useState<Resume>(result.adaptedResume);
  const [editing, setEditing] = useState(false);

  const resumeRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const printResume = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: `CV - ${resume.contact.name}`,
    pageStyle: PAGE_STYLE,
  });
  const printLetter = useReactToPrint({
    contentRef: letterRef,
    documentTitle: `Carta - ${resume.contact.name}`,
    pageStyle: PAGE_STYLE,
  });

  const clean = cleanResume(resume);

  return (
    <div className="grid gap-5">
      {warnings.length > 0 && (
        <div className="rounded-md border border-dashed border-brass/50 bg-brass-soft/50 p-4 text-sm">
          <p className="tag-label mb-2 text-brass">
            Verifique — itens que podem não estar no seu CV base
          </p>
          <ul className="grid gap-1">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span aria-hidden className="text-brass">
                  ✂
                </span>
                <span className="font-medium">{w.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{w.kind}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={editing ? "default" : "outline"} onClick={() => setEditing((e) => !e)}>
          {editing ? "Concluir edição" : "Editar"}
        </Button>
        <Button variant="secondary" onClick={() => printResume()}>
          Exportar CV <span className="font-mono text-[11px] opacity-60">PDF</span>
        </Button>
        {result.coverLetter && (
          <Button variant="secondary" onClick={() => printLetter()}>
            Exportar carta <span className="font-mono text-[11px] opacity-60">PDF</span>
          </Button>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        {editing ? (
          <Card className="shadow-xs">
            <CardContent className="p-6">
              <ResumeEditor value={resume} onChange={setResume} />
            </CardContent>
          </Card>
        ) : (
          <div className="sheet overflow-hidden rounded-sm">
            <ResumeTemplate resume={clean} />
          </div>
        )}

        <div className="grid gap-6">
          <MatchPanel match={result.match} />
          {result.coverLetter && (
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="font-display text-xl tracking-tight">
                  Carta de apresentação
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-relaxed">
                <p>{result.coverLetter.greeting}</p>
                {result.coverLetter.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className="whitespace-pre-line">{result.coverLetter.closing}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Conteúdo imprimível (fora da tela, mas no DOM para o react-to-print). */}
      <div className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
        <div ref={resumeRef}>
          <ResumeTemplate resume={clean} />
        </div>
        {result.coverLetter && (
          <div ref={letterRef}>
            <CoverLetterTemplate letter={result.coverLetter} authorName={resume.contact.name} />
          </div>
        )}
      </div>
    </div>
  );
}
