import { DatabaseSync } from "node:sqlite";
import { writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fileNameFromUrl, localPath, PUBLIC_IMAGES } from "./image-utils.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(ROOT, "..", "data", "butterfly.db");

const AVATAR_URLS = [
  "https://images.pexels.com/photos/1820575/pexels-photo-1820575.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=160&w=160",
  "https://images.pexels.com/photos/6102841/pexels-photo-6102841.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=160&w=160",
  "https://images.pexels.com/photos/698532/pexels-photo-698532.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=160&w=160",
];

async function download(url, dir) {
  const local = localPath(url, dir);
  const filePath = join(PUBLIC_IMAGES, dir, fileNameFromUrl(url));
  if (existsSync(filePath)) return "skipped";
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return "failed";
  writeFileSync(filePath, Buffer.from(await res.arrayBuffer()));
  return local;
}

async function main() {
  const db = new DatabaseSync(DB_PATH);
  const mapping = new Map();

  const products = db.prepare("SELECT id, images FROM products").all();
  const variants = db.prepare("SELECT id, productId, image, images FROM variants").all();
  const companies = db.prepare("SELECT id, logo FROM companies").all();

  const productUrls = new Set();
  for (const p of products) {
    for (const u of JSON.parse(p.images)) if (u) productUrls.add(u);
  }
  for (const v of variants) {
    if (v.image) productUrls.add(v.image);
    for (const u of JSON.parse(v.images || "[]")) if (u) productUrls.add(u);
  }

  for (const u of productUrls) {
    if (u.startsWith("http")) mapping.set(u, localPath(u, "products"));
  }
  for (const c of companies) {
    if (c.logo && c.logo.startsWith("http")) mapping.set(c.logo, localPath(c.logo, "logos"));
  }
  for (const u of AVATAR_URLS) {
    mapping.set(u, localPath(u, "avatars"));
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  for (const [url, local] of mapping) {
    const dir = local.split("/")[2];
    const result = await download(url, dir);
    if (result !== "skipped" && result !== "failed") downloaded++;
    else if (result === "skipped") skipped++;
    else {
      failed++;
      console.error(`FAIL ${url}`);
      mapping.delete(url);
    }
  }
  console.log(`images: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);

  let rows = 0;
  const updProduct = db.prepare("UPDATE products SET images = ? WHERE id = ?");
  for (const p of products) {
    const images = JSON.parse(p.images).map((u) => mapping.get(u) || u);
    const json = JSON.stringify(images);
    if (json !== p.images) {
      updProduct.run(json, p.id);
      rows++;
    }
  }
  const updVariant = db.prepare("UPDATE variants SET image = ? WHERE id = ?");
  for (const v of variants) {
    if (v.image && mapping.has(v.image)) {
      updVariant.run(mapping.get(v.image), v.id);
      rows++;
    }
  }
  const updVariantImages = db.prepare("UPDATE variants SET images = ? WHERE id = ?");
  for (const v of variants) {
    const images = JSON.parse(v.images || "[]").map((u) => mapping.get(u) || u);
    const json = JSON.stringify(images);
    if (json !== v.images) {
      updVariantImages.run(json, v.id);
      rows++;
    }
  }
  const updCompany = db.prepare("UPDATE companies SET logo = ? WHERE id = ?");
  for (const c of companies) {
    if (c.logo && mapping.has(c.logo)) {
      updCompany.run(mapping.get(c.logo), c.id);
      rows++;
    }
  }
  db.close();
  console.log(`db rows updated: ${rows}`);
  console.log("avatar local paths for HomeView.tsx:");
  for (const u of AVATAR_URLS) console.log(`  ${mapping.get(u)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
