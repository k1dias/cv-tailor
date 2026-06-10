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
    <div className="grid gap-4">
      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-semibold">⚠ Verifique estes itens — podem não estar no seu CV base:</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>
                <span className="font-medium">{w.label}</span>{" "}
                <span className="text-xs opacity-80">({w.kind})</span>
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
          Exportar CV (PDF)
        </Button>
        {result.coverLetter && (
          <Button variant="secondary" onClick={() => printLetter()}>
            Exportar carta (PDF)
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-0">
            {editing ? (
              <div className="p-6">
                <ResumeEditor value={resume} onChange={setResume} />
              </div>
            ) : (
              <ResumeTemplate resume={clean} />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <MatchPanel match={result.match} />
          {result.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle>Carta de apresentação</CardTitle>
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
