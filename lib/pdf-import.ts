"use client";

export class ScannedPdfError extends Error {
  constructor() {
    super("PDF sem camada de texto (provável digitalização). Cole o texto manualmente.");
    this.name = "ScannedPdfError";
  }
}

/**
 * Extrai texto de um PDF no browser. O pdfjs-dist é importado dinamicamente
 * (referencia DOMMatrix etc.) para nunca ser avaliado no SSR.
 * Lança ScannedPdfError se o PDF não tem camada de texto (sem OCR no MVP).
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker servido de /public (copiado por scripts/copy-pdf-worker.mjs).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+\n/g, "\n");
    pages.push(text);
  }

  const full = pages.join("\n\n").replace(/[ \t]{2,}/g, " ").trim();
  if (full.length < 30) {
    throw new ScannedPdfError();
  }
  return full;
}
