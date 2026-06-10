import type { CoverLetter } from "@/lib/schema/adapt";

/** Template imprimível da carta de apresentação. */
export function CoverLetterTemplate({
  letter,
  authorName,
}: {
  letter: CoverLetter;
  authorName?: string;
}) {
  return (
    <article className="resume-doc mx-auto max-w-[800px] bg-white p-10 text-[13px] leading-relaxed text-zinc-900">
      {authorName && <p className="mb-6 text-right text-zinc-600">{authorName}</p>}
      <p className="mb-4">{letter.greeting}</p>
      <div className="grid gap-3">
        {letter.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="mt-6 whitespace-pre-line">{letter.closing}</p>
    </article>
  );
}
