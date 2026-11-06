import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(SCRIPTS_DIR, "..");
export const PUBLIC_IMAGES = join(APP_DIR, "public", "images");

export function imagesDir(sub) {
  const dir = join(PUBLIC_IMAGES, sub);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function fileNameFromUrl(url) {
  const m = url.match(/photos\/(\d+)\//);
  if (m) return `${m[1]}.jpeg`;
  const base = url.split("?")[0].split("/").pop() || "img";
  return base.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function localPath(url, dir) {
  return `/images/${dir}/${fileNameFromUrl(url)}`;
}

export async function downloadLocal(url, dir) {
  if (!url || !url.startsWith("http")) return url || "";
  const local = localPath(url, dir);
  const filePath = join(PUBLIC_IMAGES, dir, fileNameFromUrl(url));
  mkdirSync(dirname(filePath), { recursive: true });
  if (existsSync(filePath)) return local;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return url;
    writeFileSync(filePath, Buffer.from(await res.arrayBuffer()));
    return local;
  } catch {
    return url;
  }
}

export async function resolveImages(urls, dir, concurrency = 8) {
  const out = new Array(urls.length);
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const idx = next++;
      out[idx] = await downloadLocal(urls[idx], dir);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, urls.length) }, () => worker())
  );
  return out.filter(Boolean);
}
