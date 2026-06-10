// Copia o worker do pdfjs-dist para /public, mantendo a versão em sincronia
// com a instalada (a versão do worker precisa bater com a da API).
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("[copy-pdf-worker] copiado para public/pdf.worker.min.mjs");
