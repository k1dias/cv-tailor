import { NextResponse } from "next/server";
import { StructureRequestSchema } from "@/lib/schema/adapt";
import { structureResume } from "@/lib/ai/structure";
import { sanitizeProviderError } from "@/lib/api-error";

// BYOK: usa a chave do usuário em runtime Node, uma vez, sem cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Nunca logar o corpo (contém a chave + PII).
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = StructureRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Entrada inválida.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const resume = await structureResume(parsed.data);
    return NextResponse.json(resume);
  } catch (err) {
    const { message, status } = sanitizeProviderError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
