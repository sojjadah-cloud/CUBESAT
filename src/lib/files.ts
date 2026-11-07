import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Private file storage. Files live outside /public on the server's disk
 * (UPLOAD_DIR) under random names and are served only through authorised
 * route handlers. Swap these functions for an object-storage client (S3,
 * Azure Blob, …) in production if preferred.
 */

export const LIMITS = {
  imageMb: Number(process.env.MAX_IMAGE_MB ?? 5),
  cvMb: Number(process.env.MAX_CV_MB ?? 5),
  maxImages: Number(process.env.MAX_IMAGES ?? 8),
};

export type FileKind = "image" | "cv";

const root = () => path.resolve(process.env.UPLOAD_DIR ?? "storage/uploads");

/** Detects the real file type from its magic bytes; never trusts the client's MIME type. */
export function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: "image/png", ext: "png" };
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

export const allowedFor = (kind: FileKind, mime: string) =>
  kind === "image" ? ["image/jpeg", "image/png", "image/webp"].includes(mime) : mime === "application/pdf";

export const maxBytes = (kind: FileKind) => (kind === "image" ? LIMITS.imageMb : LIMITS.cvMb) * 1024 * 1024;

export async function storeFile(buf: Buffer, ext: string): Promise<string> {
  const now = new Date();
  const key = path.posix.join(
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    `${crypto.randomUUID()}.${ext}`,
  );
  const full = path.join(root(), key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf, { flag: "wx" });
  return key;
}

function resolveKey(key: string) {
  const base = root();
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export const readFile = (key: string) => fs.readFile(resolveKey(key));

export async function deleteFile(key: string) {
  await fs.rm(resolveKey(key), { force: true });
}

/** Strips path components and control characters from a user-supplied filename. */
export function safeName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[\u0000-\u001f\u007f"]/g, "").slice(0, 150) || "file";
}

export function contentDisposition(type: "inline" | "attachment", name: string) {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
