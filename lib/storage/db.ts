"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Resume } from "@/lib/schema/resume";
import type { AdaptResult, OutputLanguage, Provider } from "@/lib/schema/adapt";

/**
 * Persistência local (IndexedDB). Fonte de verdade do CV base e do histórico.
 * Nada disso vai para o servidor. Limpável via lib/storage/clear.ts.
 */

export interface BaseCv {
  rawText: string;
  structured?: Resume;
  updatedAt: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  jobTitleGuess: string;
  language: OutputLanguage;
  provider: Provider;
  hadCoverLetter: boolean;
  matchScore: number;
  jobDescription: string;
  result: AdaptResult;
}

interface CvTailorDB extends DBSchema {
  kv: {
    key: string;
    value: BaseCv;
  };
  history: {
    key: string;
    value: HistoryEntry;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "cv-tailor";
const DB_VERSION = 1;
const BASE_CV_KEY = "baseCv";

let dbPromise: Promise<IDBPDatabase<CvTailorDB>> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB indisponível no servidor.");
  }
  if (!dbPromise) {
    dbPromise = openDB<CvTailorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("kv");
        const hist = db.createObjectStore("history", { keyPath: "id" });
        hist.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function getBaseCv(): Promise<BaseCv | undefined> {
  const db = await getDb();
  return db.get("kv", BASE_CV_KEY);
}

export async function saveBaseCv(data: Omit<BaseCv, "updatedAt">): Promise<void> {
  const db = await getDb();
  await db.put("kv", { ...data, updatedAt: Date.now() }, BASE_CV_KEY);
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const db = await getDb();
  await db.put("history", entry);
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("history", "by-createdAt");
  return all.reverse(); // mais recentes primeiro
}

export async function deleteHistory(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("history", id);
}

/** Apaga TODO o conteúdo do IndexedDB (CV base + histórico). */
export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await Promise.all([db.clear("kv"), db.clear("history")]);
}
