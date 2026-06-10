"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractPdfText, ScannedPdfError } from "@/lib/pdf-import";

interface Props {
  onExtracted: (text: string) => void;
}

export function CvPdfImport({ onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const text = await extractPdfText(file);
      onExtracted(text);
      toast.success("Texto extraído do PDF. Revise antes de salvar.");
    } catch (err) {
      if (err instanceof ScannedPdfError) {
        toast.error(err.message);
      } else {
        toast.error("Não foi possível ler o PDF. Cole o texto manualmente.");
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Lendo PDF..." : "Importar PDF"}
      </Button>
    </>
  );
}
