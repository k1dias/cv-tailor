/**
 * Classifica erros de provider em mensagem limpa + status HTTP, sem nunca
 * ecoar a chave do usuário nem o corpo da requisição.
 */
export function sanitizeProviderError(err: unknown): { message: string; status: number } {
  const text = err instanceof Error ? err.message : String(err);
  if (/api key|unauthorized|invalid x-api-key|incorrect api key|authentication|401/i.test(text)) {
    return {
      message: "Chave de API inválida ou sem permissão. Confira a chave do provedor.",
      status: 401,
    };
  }
  if (/rate limit|429/i.test(text)) {
    return {
      message: "Limite de requisições atingido no provedor. Tente novamente em instantes.",
      status: 429,
    };
  }
  if (/quota|insufficient|billing|credit/i.test(text)) {
    return { message: "Sua conta no provedor está sem créditos/quota.", status: 402 };
  }
  return { message: "Falha ao processar com a IA. Tente novamente.", status: 502 };
}
