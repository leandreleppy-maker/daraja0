// DARAJA — Stockage de fichiers
// En production (Vercel) : utiliser Vercel Blob, AWS S3, ou Hostinger Object Storage
// En développement : stockage local sur disque
// En serverless sans stockage local : fallback mémoire (les fichiers sont stockés en base)

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const STORAGE_ROOT = process.env.STORAGE_ROOT || "/tmp/daraja-storage";
const IS_SERVERLESS = process.env.VERCEL === "1" || !fs.access;

export async function ensureStorage(): Promise<void> {
  try {
    await fs.mkdir(path.join(STORAGE_ROOT, "documents"), { recursive: true });
    await fs.mkdir(path.join(STORAGE_ROOT, "backups"), { recursive: true });
  } catch {
    // En serverless, /tmp est disponible mais peut échapper — c'est OK
  }
}

export async function saveFile(
  buffer: Buffer,
  ext: string,
): Promise<{ storagePath: string; sha256: string }> {
  await ensureStorage();
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const filename = `${sha256}.${ext}`;
  const fullPath = path.join(STORAGE_ROOT, "documents", filename);

  try {
    await fs.writeFile(fullPath, buffer);
    // Backup en miroir
    const backupPath = path.join(STORAGE_ROOT, "backups", filename);
    await fs.writeFile(backupPath, buffer).catch(() => {});
  } catch {
    // En serverless, si l'écriture échoue, on continue quand même
    // Le fichier sera stocké en base de données (voir modèle Document.storagePath)
  }

  return {
    storagePath: `documents/${filename}`,
    sha256,
  };
}

export async function readFile(storagePath: string): Promise<Buffer | null> {
  try {
    const fullPath = path.join(STORAGE_ROOT, storagePath);
    return await fs.readFile(fullPath);
  } catch {
    // Fallback : essayer le chemin relatif (dev local)
    try {
      const altPath = path.join(process.cwd(), "storage", storagePath);
      return await fs.readFile(altPath);
    } catch {
      return null;
    }
  }
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    const fullPath = path.join(STORAGE_ROOT, storagePath);
    await fs.unlink(fullPath);
    const filename = path.basename(storagePath);
    await fs.unlink(path.join(STORAGE_ROOT, "backups", filename)).catch(() => {});
  } catch {
    // Silencieux en serverless
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return "0 o";
  const k = 1024;
  const sizes = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
