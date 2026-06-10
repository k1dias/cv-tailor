import type { Resume } from "@/lib/schema/resume";

/**
 * Template único, limpo e ATS-friendly. Coluna única, semântico, sem
 * elementos exóticos — renderiza bem na tela e no PDF (react-to-print).
 */
export function ResumeTemplate({ resume }: { resume: Resume }) {
  const c = resume.contact;
  return (
    <article className="resume-doc mx-auto max-w-[800px] bg-white p-10 text-[13px] leading-relaxed text-zinc-900">
      <header className="border-b border-zinc-300 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
        <p className="mt-1 text-zinc-600">
          {[c.email, c.phone, c.location].filter(Boolean).join("  •  ")}
        </p>
        {c.links.length > 0 && (
          <p className="text-zinc-600">
            {c.links.map((l, i) => (
              <span key={i}>
                {i > 0 && "  •  "}
                {l.label}: {l.url}
              </span>
            ))}
          </p>
        )}
      </header>

      {resume.summary && (
        <Section title="Resumo">
          <p>{resume.summary}</p>
        </Section>
      )}

      {resume.experience.length > 0 && (
        <Section title="Experiência">
          <div className="grid gap-3">
            {resume.experience.map((e, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="font-semibold">
                    {e.title} — {e.company}
                    {e.location ? <span className="font-normal text-zinc-600">, {e.location}</span> : null}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {e.start} – {e.current ? "Atual" : e.end ?? ""}
                  </p>
                </div>
                <ul className="mt-1 list-disc pl-5">
                  {e.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title="Skills">
          <div className="grid gap-1">
            {resume.skills.map((g, i) => (
              <p key={i}>
                {g.category && <span className="font-semibold">{g.category}: </span>}
                {g.items.join(", ")}
              </p>
            ))}
          </div>
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title="Formação">
          <div className="grid gap-1">
            {resume.education.map((ed, i) => (
              <p key={i}>
                <span className="font-semibold">
                  {[ed.degree, ed.field].filter(Boolean).join(" em ")}
                </span>
                {[ed.degree, ed.field].some(Boolean) ? " — " : ""}
                {ed.institution}
                {[ed.start, ed.end].filter(Boolean).length
                  ? ` (${[ed.start, ed.end].filter(Boolean).join(" – ")})`
                  : ""}
              </p>
            ))}
          </div>
        </Section>
      )}

      {resume.certifications && resume.certifications.length > 0 && (
        <Section title="Certificações">
          <ul className="list-disc pl-5">
            {resume.certifications.map((ct, i) => (
              <li key={i}>
                {ct.name}
                {ct.issuer ? ` — ${ct.issuer}` : ""}
                {ct.year ? ` (${ct.year})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {resume.languages && resume.languages.length > 0 && (
        <Section title="Idiomas">
          <p>{resume.languages.map((l) => `${l.language}${l.level ? ` (${l.level})` : ""}`).join("  •  ")}</p>
        </Section>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}
