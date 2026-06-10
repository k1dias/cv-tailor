import { NextResponse } from "next/server";
import { AdaptRequestSchema } from "@/lib/schema/adapt";
import { runAdaptation } from "@/lib/ai/adapt";
import { sanitizeProviderError } from "@/lib/api-error";

// BYOK: usa a chave do usuário em runtime Node, uma vez, sem cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // IMPORTANTE: nunca logar o corpo da requisição (contém a chave + PII).
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = AdaptRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Entrada inválida.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const result = await runAdaptation(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    // Classifica e repassa mensagem limpa, sem ecoar a chave nem o corpo.
    const { message, status } = sanitizeProviderError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
