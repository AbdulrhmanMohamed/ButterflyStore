import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { downloadLocal, resolveImages } from "./image-utils.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(ROOT, "..", "data");
const DB_PATH = join(DATA_DIR, "butterfly.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  nameEn TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  descriptionEn TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  nameEn TEXT NOT NULL DEFAULT '',
  parentId TEXT,
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL DEFAULT '',
  categoryId TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  nameEn TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  descriptionEn TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  images TEXT NOT NULL DEFAULT '[]',
  discountPercentage REAL NOT NULL DEFAULT 0,
  variantAttrs TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL DEFAULT '',
  attrs TEXT NOT NULL DEFAULT '{}',
  sku TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  showStock INTEGER NOT NULL DEFAULT 1,
  image TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'client',
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL DEFAULT '',
  customerName TEXT NOT NULL DEFAULT '',
  customerPhone TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  total REAL NOT NULL DEFAULT 0,
  finalTotal REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS discountCodes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL DEFAULT '',
  percentage REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  maxUses INTEGER NOT NULL DEFAULT 0,
  scope TEXT NOT NULL DEFAULT '',
  scopeId TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS paymentMethods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  nameEn TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT ''
);
`;

const COMPANIES = [
  {
    id: "comp_butterfly",
    name: "باترفلاي سكارف",
    nameEn: "Butterfly Scarf",
    logoQuery: "hijab scarf brand",
    description: "ماركة متخصصة في الإيشاربات والشالات الحريمي — شيفون، قطن، ستان بجودة عالية وتصاميم عصرية.",
    descriptionEn: "Specialized hijab & scarf brand — chiffon, cotton, satin with premium quality and modern designs.",
    active: true,
  },
  {
    id: "comp_hijab-house",
    name: "بيت الحجاب",
    nameEn: "Hijab House",
    logoQuery: "hijab fashion logo",
    description: "بيت الحجاب — تشكيلة واسعة من حجاب الشيفون والقطن والجيرسيه بألوان عصرية.",
    descriptionEn: "Hijab House — wide collection of chiffon, cotton and jersey hijabs in trendy colors.",
    active: true,
  },
  {
    id: "comp_scarfella",
    name: "سكارفيلا",
    nameEn: "Scarfella",
    logoQuery: "elegant scarf logo",
    description: "سكارفيلا — لمسة أنثوية راقية، شالات ستان وحرير مطبوعة وسادة.",
    descriptionEn: "Scarfella — feminine elegance, satin and silk scarves printed and solid.",
    active: true,
  },
];

const CATEGORIES = [
  // Butterfly
  { id: "cat_bf-chiffon", companyId: "comp_butterfly", name: "حجاب شيفون", nameEn: "Chiffon Hijab", parent: null },
  { id: "cat_bf-cotton", companyId: "comp_butterfly", name: "حجاب قطن", nameEn: "Cotton Hijab", parent: null },
  { id: "cat_bf-satin", companyId: "comp_butterfly", name: "حجاب ستان", nameEn: "Satin Hijab", parent: null },
  // Hijab House
  { id: "cat_hh-chiffon", companyId: "comp_hijab-house", name: "حجاب شيفون", nameEn: "Chiffon Hijab", parent: null },
  { id: "cat_hh-cotton", companyId: "comp_hijab-house", name: "حجاب قطن", nameEn: "Cotton Hijab", parent: null },
  { id: "cat_hh-jersey", companyId: "comp_hijab-house", name: "حجاب جيرسيه", nameEn: "Jersey Hijab", parent: null },
  // Scarfella
  { id: "cat_sf-chiffon", companyId: "comp_scarfella", name: "حجاب شيفون", nameEn: "Chiffon Hijab", parent: null },
  { id: "cat_sf-satin", companyId: "comp_scarfella", name: "حجاب ستان", nameEn: "Satin Hijab", parent: null },
  { id: "cat_sf-printed", companyId: "comp_scarfella", name: "شالات مطبوعة", nameEn: "Printed Shawls", parent: null },
];

const PRODUCTS = [
  // Butterfly - Chiffon
  {
    id: "prod_bf-chiffon-floral",
    companyId: "comp_butterfly",
    categoryId: "cat_bf-chiffon",
    name: "حجاب شيفون مشجر",
    nameEn: "Floral Chiffon Hijab",
    description: "حجاب شيفون خفيف بطبعة زهور ناعمة، مثالي للإطلالات اليومية والمناسبات.",
    descriptionEn: "Light chiffon hijab with soft floral print, perfect for daily and occasion looks.",
    price: 120, discountPercentage: 0, variantAttrs: ["color"], skuBase: "BF-CF", pexelsQuery: "chiffon hijab floral",
    colors: [{ ar: "بيج", sku: "BGE" }, { ar: "وردي", sku: "PNK" }, { ar: "سماوي", sku: "SKY" }],
  },
  {
    id: "prod_bf-chiffon-plain",
    companyId: "comp_butterfly",
    categoryId: "cat_bf-chiffon",
    name: "حجاب شيفون سادة",
    nameEn: "Plain Chiffon Hijab",
    description: "حجاب شيفون سادة بألوان هادئة وثبات عالي، يناسب كل الألوان.",
    descriptionEn: "Plain chiffon hijab in calm colors with high stay, matches every outfit.",
    price: 95, discountPercentage: 10, variantAttrs: ["color"], skuBase: "BF-CP", pexelsQuery: "plain chiffon hijab",
    colors: [{ ar: "أسود", sku: "BLK" }, { ar: "كريمي", sku: "CRM" }, { ar: "كحلي", sku: "NAV" }],
  },
  // Butterfly - Cotton
  {
    id: "prod_bf-cotton-solid",
    companyId: "comp_butterfly",
    categoryId: "cat_bf-cotton",
    name: "حجاب قطن سادة",
    nameEn: "Solid Cotton Hijab",
    description: "حجاب قطن مصري 100% ناعم وثابت، مريح طوال اليوم.",
    descriptionEn: "100% Egyptian cotton hijab, soft and stay-put, comfortable all day.",
    price: 85, discountPercentage: 0, variantAttrs: ["color"], skuBase: "BF-CT", pexelsQuery: "cotton hijab",
    colors: [{ ar: "أبيض", sku: "WHT" }, { ar: "رمادي", sku: "GRY" }, { ar: "زيتوني", sku: "OLV" }],
  },
  // Butterfly - Satin
  {
    id: "prod_bf-satin-luxe",
    companyId: "comp_butterfly",
    categoryId: "cat_bf-satin",
    name: "حجاب ستان لامع",
    nameEn: "Luxe Satin Hijab",
    description: "حجاب ستان بلمعة راقية وملمس حريري، للمناسبات والسهرات.",
    descriptionEn: "Satin hijab with elegant sheen and silky feel, for occasions and evenings.",
    price: 150, discountPercentage: 15, variantAttrs: ["color"], skuBase: "BF-ST", pexelsQuery: "satin hijab",
    colors: [{ ar: "شامبين", sku: "CHM" }, { ar: "نبيتي", sku: "BUR" }, { ar: "أسود", sku: "BLK" }],
  },
  // Hijab House - Chiffon
  {
    id: "prod_hh-chiffon-ombre",
    companyId: "comp_hijab-house",
    categoryId: "cat_hh-chiffon",
    name: "حجاب شيفون أومبريه",
    nameEn: "Ombre Chiffon Hijab",
    description: "حجاب شيفون بتدرج ألوان عصري، خفيف وانسيابي.",
    descriptionEn: "Chiffon hijab with modern ombre gradient, light and flowy.",
    price: 130, discountPercentage: 0, variantAttrs: ["color"], skuBase: "HH-CF", pexelsQuery: "ombre chiffon hijab",
    colors: [{ ar: "بيج-وردي", sku: "BPK" }, { ar: "رمادي-أزرق", sku: "GBL" }],
  },
  {
    id: "prod_hh-chiffon-pleated",
    companyId: "comp_hijab-house",
    categoryId: "cat_hh-chiffon",
    name: "حجاب شيفون بليسيه",
    nameEn: "Pleated Chiffon Hijab",
    description: "حجاب شيفون بليسيه ثابت بدون دبابيس، عملي وأنيق.",
    descriptionEn: "Pleated chiffon hijab, stay-put without pins, practical and elegant.",
    price: 140, discountPercentage: 10, variantAttrs: ["color"], skuBase: "HH-PL", pexelsQuery: "pleated hijab",
    colors: [{ ar: "كريمي", sku: "CRM" }, { ar: "أسود", sku: "BLK" }, { ar: "بيج", sku: "BGE" }],
  },
  // Hijab House - Cotton
  {
    id: "prod_hh-cotton-jersey",
    companyId: "comp_hijab-house",
    categoryId: "cat_hh-cotton",
    name: "حجاب قطن جيرسيه",
    nameEn: "Jersey Cotton Hijab",
    description: "حجاب قطن جيرسيه مطاطي وثابت، لا يحتاج دبابيس.",
    descriptionEn: "Jersey cotton hijab, stretchy and stay-put, no pins needed.",
    price: 110, discountPercentage: 0, variantAttrs: ["color"], skuBase: "HH-CT", pexelsQuery: "jersey hijab",
    colors: [{ ar: "أسود", sku: "BLK" }, { ar: "كحلي", sku: "NAV" }, { ar: "بني", sku: "BRN" }],
  },
  // Hijab House - Jersey
  {
    id: "prod_hh-jersey-solid",
    companyId: "comp_hijab-house",
    categoryId: "cat_hh-jersey",
    name: "حجاب جيرسيه سادة",
    nameEn: "Solid Jersey Hijab",
    description: "حجاب جيرسيه سادة بثبات ممتاز، للاستخدام اليومي والعمل.",
    descriptionEn: "Solid jersey hijab with excellent stay, for daily and work use.",
    price: 90, discountPercentage: 0, variantAttrs: ["color"], skuBase: "HH-JS", pexelsQuery: "jersey hijab plain",
    colors: [{ ar: "رمادي", sku: "GRY" }, { ar: "بيج", sku: "BGE" }, { ar: "وردي", sku: "PNK" }],
  },
  // Scarfella - Chiffon
  {
    id: "prod_sf-chiffon-printed",
    companyId: "comp_scarfella",
    categoryId: "cat_sf-chiffon",
    name: "حجاب شيفون مطبوع",
    nameEn: "Printed Chiffon Hijab",
    description: "حجاب شيفون مطبوع بنقشة عصرية، خفيف ومريح.",
    descriptionEn: "Printed chiffon hijab with modern pattern, light and comfortable.",
    price: 125, discountPercentage: 0, variantAttrs: ["color"], skuBase: "SF-CP", pexelsQuery: "printed chiffon hijab",
    colors: [{ ar: "متعدد", sku: "MLT" }, { ar: "أزرق", sku: "BLU" }],
  },
  // Scarfella - Satin
  {
    id: "prod_sf-satin-plain",
    companyId: "comp_scarfella",
    categoryId: "cat_sf-satin",
    name: "حجاب ستان سادة",
    nameEn: "Plain Satin Hijab",
    description: "حجاب ستان سادة بلمعة ناعمة، يليق بالمناسبات.",
    descriptionEn: "Plain satin hijab with soft sheen, perfect for occasions.",
    price: 155, discountPercentage: 20, variantAttrs: ["color"], skuBase: "SF-ST", pexelsQuery: "satin hijab plain",
    colors: [{ ar: "عاجي", sku: "IVY" }, { ar: "وردي", sku: "PNK" }, { ar: "كحلي", sku: "NAV" }],
  },
  // Scarfella - Printed Shawls
  {
    id: "prod_sf-printed-shawl",
    companyId: "comp_scarfella",
    categoryId: "cat_sf-printed",
    name: "شال مطبوع واسع",
    nameEn: "Wide Printed Shawl",
    description: "شال واسع مطبوع بنقشة فنية، يصلح كحجاب أو شال كتف.",
    descriptionEn: "Wide printed shawl with artistic pattern, wear as hijab or shoulder shawl.",
    price: 180, discountPercentage: 0, variantAttrs: ["color"], skuBase: "SF-SH", pexelsQuery: "printed shawl hijab",
    colors: [{ ar: "خردلي", sku: "MST" }, { ar: "أخضر", sku: "GRN" }, { ar: "نبيتي", sku: "BUR" }],
  },
];

function buildVariants(p) {
  return p.colors.map((c, i) => ({
    sku: `${p.skuBase}-${c.sku}`,
    attrs: { color: c.ar },
    price: p.price,
    stock: 12 + ((i * 7) % 30),
  }));
}
function variantGallery(images, i) {
  const n = images.length;
  if (n === 0) return [];
  const count = Math.min(4, n);
  const start = (i * 3) % n;
  const out = [];
  for (let k = 0; k < count; k++) out.push(images[(start + k) % n]);
  return out;
}
function loadEnv() {
  const envPath = join(ROOT, "..", ".env");
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
async function searchPexels(key, query, perPage = 30) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  try {
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map((p) => p.src.large).filter(Boolean);
  } catch { return []; }
}
function now() { return new Date().toISOString(); }
function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

async function main() {
  const env = loadEnv();
  const key = env.PEXELS_API_KEY || "";
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  for (const t of ["variants","products","categories","companies","users","orders","customers","discountCodes","paymentMethods"]) db.exec(`DELETE FROM ${t}`);
  const insComp = db.prepare("INSERT INTO companies (id, name, nameEn, logo, description, descriptionEn, active, createdAt) VALUES (?,?,?,?,?,?,?,?)");
  for (const c of COMPANIES) {
    let logo = "";
    if (key) { const imgs = await searchPexels(key, c.logoQuery, 5); logo = await downloadLocal(imgs[0] || "", "logos"); }
    insComp.run(c.id, c.name, c.nameEn, logo, c.description, c.descriptionEn, 1, now());
    console.log(`company: ${c.nameEn} ${logo?"(logo ✓)":""}`);
  }
  const insCat = db.prepare("INSERT INTO categories (id, companyId, name, nameEn, parentId, createdAt) VALUES (?,?,?,?,?,?)");
  for (const c of CATEGORIES) insCat.run(c.id, c.companyId, c.name, c.nameEn, c.parent, now());
  console.log(`categories: ${CATEGORIES.length}`);
  const insProd = db.prepare("INSERT INTO products (id, companyId, categoryId, name, nameEn, description, descriptionEn, price, images, discountPercentage, variantAttrs, active, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
  const insVar = db.prepare("INSERT INTO variants (id, productId, attrs, sku, price, stock, showStock, image, images, active, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  for (const p of PRODUCTS) {
    let images = [];
    if (key) { const remote = await searchPexels(key, p.pexelsQuery, 30); images = await resolveImages(remote, "products"); }
    insProd.run(p.id, p.companyId, p.categoryId, p.name, p.nameEn, p.description, p.descriptionEn, p.price, JSON.stringify(images), p.discountPercentage, JSON.stringify(p.variantAttrs), 1, now());
    const list = buildVariants(p);
    list.forEach((v,i)=>{
      const vImgs = variantGallery(images,i);
      insVar.run(`${p.id}#${i}`, p.id, JSON.stringify(v.attrs), v.sku, v.price, v.stock, 1, vImgs[0]||"", JSON.stringify(vImgs), 1, now());
    });
    console.log(`product: ${p.nameEn} (${images.length} imgs, ${list.length} variants)`);
  }
  const insUser = db.prepare("INSERT INTO users (id, name, phone, role, createdAt) VALUES (?,?,?,?,?)");
  [["user_owner","محمد عبدالله","01000000001","owner"],["user_admin","ياسمين محمود","01220757043","admin"],["user_client","سارة محمد","01012345678","client"]].forEach(u=>insUser.run(u[0],u[1],u[2],u[3],now()));
  console.log(`users: 3`);
  const insCust = db.prepare("INSERT INTO customers (id, name, phone, address, createdAt) VALUES (?,?,?,?,?)");
  insCust.run("cust_1","سارة محمد","01012345678","مدينة نصر، القاهرة",daysAgo(5));
  const insPm = db.prepare("INSERT INTO paymentMethods (id, name, nameEn, active, createdAt) VALUES (?,?,?,?,?)");
  [["pm_cod","الدفع عند الاستلام","Cash on Delivery"],["pm_vodafone","فودافون كاش","Vodafone Cash"],["pm_instapay","انستاباي","InstaPay"]].forEach(p=>insPm.run(p[0],p[1],p[2],1,now()));
  db.close();
  console.log(`\nSeed hijab complete → ${DB_PATH}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
