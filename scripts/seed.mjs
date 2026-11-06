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

/* ============ COMPANIES (real Egyptian brands) ============ */
const COMPANIES = [
  {
    id: "comp_misr-spinning",
    name: "مصر للغزل والنسيج",
    nameEn: "Misr Spinning & Weaving",
    logoQuery: "textile industry logo",
    description: "عملاق صناعة الغزل والنسيج المصري منذ 1927، يقدم منتجات قطنية مصرية 100% بأعلى جودة.",
    descriptionEn: "The Egyptian textile industry giant since 1927, offering 100% Egyptian cotton products of the highest quality.",
    active: true,
  },
  {
    id: "comp_kher-zaman",
    name: "خير زمان",
    nameEn: "Kher Zaman",
    logoQuery: "leather brand logo",
    description: "ماركة مصرية فاخرة للأزياء والإكسسوارات، تجمع بين التراث الأصيل والتصميم العصري.",
    descriptionEn: "A luxury Egyptian fashion & accessories brand blending authentic heritage with modern design.",
    active: true,
  },
  {
    id: "comp_okhtein",
    name: "أوختين",
    nameEn: "Okhtein",
    logoQuery: "luxury fashion logo",
    description: "دار تصميم مصرية تأسست على يد شقيقتين، تشتهر بالأوشحة الحريرية المطبوعة بلمسة فنية.",
    descriptionEn: "An Egyptian design house founded by two sisters, known for artistically printed silk scarves.",
    active: true,
  },
  {
    id: "comp_concrete",
    name: "كونكريت",
    nameEn: "Concrete",
    logoQuery: "streetwear brand logo",
    description: "ماركة إيجي بانك معاصرة للباندانا وقبعات وإكسسوارات الشارع بأجواء الشباب.",
    descriptionEn: "A contemporary Egyptian streetwear brand for bandanas, caps and youth-culture accessories.",
    active: true,
  },
];

/* ============ CATEGORY HIERARCHY ============ */
const CATEGORIES = [
  // Misr Spinning & Weaving
  { key: "misr-cotton", id: "cat_misr-cotton", companyId: "comp_misr-spinning", name: "المنسوجات القطنية", nameEn: "Cotton Textiles", parent: null },
  { key: "misr-cotton-scarves", id: "cat_misr-cotton-scarves", companyId: "comp_misr-spinning", name: "إيشاربات قطن", nameEn: "Cotton Scarves", parent: "cat_misr-cotton" },
  { key: "misr-cotton-shawls", id: "cat_misr-cotton-shawls", companyId: "comp_misr-spinning", name: "شالات قطن", nameEn: "Cotton Shawls", parent: "cat_misr-cotton" },
  { key: "misr-wool", id: "cat_misr-wool", companyId: "comp_misr-spinning", name: "تشكيلة الصوف", nameEn: "Wool Collection", parent: null },
  { key: "misr-wool-shawls", id: "cat_misr-wool-shawls", companyId: "comp_misr-spinning", name: "شالات صوف", nameEn: "Wool Shawls", parent: "cat_misr-wool" },

  // Kher Zaman
  { key: "kher-luxury", id: "cat_kher-luxury", companyId: "comp_kher-zaman", name: "الشالات الفاخرة", nameEn: "Luxury Shawls", parent: null },
  { key: "kher-pashmina", id: "cat_kher-pashmina", companyId: "comp_kher-zaman", name: "باشمينا", nameEn: "Pashmina", parent: "cat_kher-luxury" },
  { key: "kher-silk", id: "cat_kher-silk", companyId: "comp_kher-zaman", name: "شالات حرير", nameEn: "Silk Shawls", parent: "cat_kher-luxury" },
  { key: "kher-accessories", id: "cat_kher-accessories", companyId: "comp_kher-zaman", name: "الإكسسوارات", nameEn: "Accessories", parent: null },
  { key: "kher-leather", id: "cat_kher-leather", companyId: "comp_kher-zaman", name: "الجلديات", nameEn: "Leather Goods", parent: "cat_kher-accessories" },

  // Okhtein
  { key: "okhtein-scarves", id: "cat_okhtein-scarves", companyId: "comp_okhtein", name: "أوشحة حرير", nameEn: "Silk Scarves", parent: null },
  { key: "okhtein-printed", id: "cat_okhtein-printed", companyId: "comp_okhtein", name: "أوشحة مطبوعة", nameEn: "Printed Scarves", parent: "cat_okhtein-scarves" },
  { key: "okhtein-solid", id: "cat_okhtein-solid", companyId: "comp_okhtein", name: "أوشحة سادة", nameEn: "Solid Scarves", parent: "cat_okhtein-scarves" },
  { key: "okhtein-wraps", id: "cat_okhtein-wraps", companyId: "comp_okhtein", name: "شالات صيفية", nameEn: "Summer Wraps", parent: null },
  { key: "okhtein-cotton-wraps", id: "cat_okhtein-cotton-wraps", companyId: "comp_okhtein", name: "شالات قطن", nameEn: "Cotton Wraps", parent: "cat_okhtein-wraps" },

  // Concrete
  { key: "concrete-bandanas", id: "cat_concrete-bandanas", companyId: "comp_concrete", name: "الباندانا", nameEn: "Bandanas", parent: null },
  { key: "concrete-cotton-bandanas", id: "cat_concrete-cotton-bandanas", companyId: "comp_concrete", name: "باندانا قطن", nameEn: "Cotton Bandanas", parent: "cat_concrete-bandanas" },
  { key: "concrete-silk-bandanas", id: "cat_concrete-silk-bandanas", companyId: "comp_concrete", name: "باندانا حرير", nameEn: "Silk Bandanas", parent: "cat_concrete-bandanas" },
  { key: "concrete-street", id: "cat_concrete-street", companyId: "comp_concrete", name: "إكسسوارات ستريت", nameEn: "Street Accessories", parent: null },
  { key: "concrete-caps", id: "cat_concrete-caps", companyId: "comp_concrete", name: "القبعات", nameEn: "Caps", parent: "cat_concrete-street" },
  { key: "concrete-neck", id: "cat_concrete-neck", companyId: "comp_concrete", name: "أغطية الرقبة", nameEn: "Neck Warmers", parent: "cat_concrete-street" },
];

/* ============ PRODUCTS ============ */
const PRODUCTS = [
  {
    id: "prod_misr-cotton-scarf",
    companyId: "comp_misr-spinning",
    categoryKey: "misr-cotton-scarves",
    name: "إيشارب قطن مصري 100%",
    nameEn: "100% Egyptian Cotton Scarf",
    description: "إيشارب قطن مصري خالص، ناعم على البشرة ومناسب للاستخدام اليومي على مدار السنة.",
    descriptionEn: "Pure Egyptian cotton scarf, soft on the skin and perfect for daily use all year round.",
    price: 95,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "MCS",
    pexelsQuery: "cotton scarf",
    colors: [
      { ar: "أبيض", sku: "WHT" },
      { ar: "بيج", sku: "BGE" },
      { ar: "كحلي", sku: "NAV" },
      { ar: "أسود", sku: "BLK" },
      { ar: "رمادي", sku: "GRY" },
    ],
  },
  {
    id: "prod_misr-embroidered-scarf",
    companyId: "comp_misr-spinning",
    categoryKey: "misr-cotton-scarves",
    name: "إيشارب قطن مطرز",
    nameEn: "Embroidered Cotton Scarf",
    description: "إيشارب قطن مصري بتطريز يدوي رقيق على الأطراف، لمسة راقية لإطلالتك اليومية.",
    descriptionEn: "Egyptian cotton scarf with delicate hand embroidery on the edges — an elegant daily touch.",
    price: 140,
    discountPercentage: 10,
    variantAttrs: ["color"],
    skuBase: "MES",
    pexelsQuery: "embroidered scarf",
    colors: [
      { ar: "بيج", sku: "BGE" },
      { ar: "وردي", sku: "ROS" },
      { ar: "كريمي", sku: "CRM" },
      { ar: "زيتوني", sku: "OLV" },
    ],
  },
  {
    id: "prod_misr-cotton-shawl",
    companyId: "comp_misr-spinning",
    categoryKey: "misr-cotton-shawls",
    name: "شال قطن سادة",
    nameEn: "Solid Cotton Shawl",
    description: "شال قطني واسع بقطن مصري فاخر، مثالي لفصول الانتقال وللمكتب.",
    descriptionEn: "Wide cotton shawl in premium Egyptian cotton, ideal for transitional seasons and the office.",
    price: 160,
    discountPercentage: 0,
    variantAttrs: ["color", "size"],
    skuBase: "MCSW",
    pexelsQuery: "cotton shawl",
    sizeExtra: { "160x160": 20 },
    colors: [
      { ar: "رمادي", sku: "GRY" },
      { ar: "بيج", sku: "BGE" },
      { ar: "كحلي", sku: "NAV" },
      { ar: "بني", sku: "BRN" },
    ],
    sizes: [
      { ar: "140x140", sku: "140" },
      { ar: "160x160", sku: "160" },
    ],
  },
  {
    id: "prod_misr-classic-wool",
    companyId: "comp_misr-spinning",
    categoryKey: "misr-wool-shawls",
    name: "شال صوف كلاسيك",
    nameEn: "Classic Wool Shawl",
    description: "شال صوف كلاسيكي بدفء عالٍ وخامة متينة، الأفضل لمصيف البرد القارس.",
    descriptionEn: "Classic wool shawl with high warmth and durable fabric — best for freezing weather.",
    price: 300,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "MWC",
    pexelsQuery: "wool shawl",
    colors: [
      { ar: "كحلي", sku: "NAV" },
      { ar: "رمادي", sku: "GRY" },
      { ar: "بني", sku: "BRN" },
      { ar: "أسود", sku: "BLK" },
      { ar: "نبيتي", sku: "BUR" },
    ],
  },
  {
    id: "prod_misr-royal-wool",
    companyId: "comp_misr-spinning",
    categoryKey: "misr-wool-shawls",
    name: "شال صوف ملكي",
    nameEn: "Royal Wool Shawl",
    description: "شال صوف ملكي بتشطيب فاخر وحافة مزخرفة، قطعة تليق بأرقى الإطلالات.",
    descriptionEn: "Royal wool shawl with a luxurious finish and ornate edge — a piece for the finest looks.",
    price: 380,
    discountPercentage: 20,
    variantAttrs: ["color", "size"],
    skuBase: "MWR",
    pexelsQuery: "cashmere shawl",
    sizeExtra: { "170x170": 40 },
    colors: [
      { ar: "أسود", sku: "BLK" },
      { ar: "نبيتي", sku: "BUR" },
      { ar: "زيتوني", sku: "OLV" },
      { ar: "رمادي", sku: "GRY" },
    ],
    sizes: [
      { ar: "150x150", sku: "150" },
      { ar: "170x170", sku: "170" },
    ],
  },
  {
    id: "prod_kher-pashmina",
    companyId: "comp_kher-zaman",
    categoryKey: "kher-pashmina",
    name: "باشمينا كشمير",
    nameEn: "Cashmere Pashmina",
    description: "باشمينا من خيوط الكشمير الفاخرة، نعومة استثنائية ودفء خفيف بملمس حريري.",
    descriptionEn: "Pashmina woven from luxury cashmere yarn — exceptional softness and feather-light warmth.",
    price: 550,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "KPS",
    pexelsQuery: "pashmina shawl",
    colors: [
      { ar: "بيج", sku: "BGE" },
      { ar: "رمادي", sku: "GRY" },
      { ar: "زيتوني", sku: "OLV" },
      { ar: "كريمي", sku: "CRM" },
      { ar: "أسود", sku: "BLK" },
    ],
  },
  {
    id: "prod_kher-embroidered-pashmina",
    companyId: "comp_kher-zaman",
    categoryKey: "kher-pashmina",
    name: "باشمينا مطرزة يدوياً",
    nameEn: "Hand-Embroidered Pashmina",
    description: "باشمينا بتطريز يدوي على الزوايا من خامات مختارة، تحفة فنية بلمسة مصرية.",
    descriptionEn: "Pashmina with hand embroidery on the corners in selected materials — an Egyptian artistic masterpiece.",
    price: 650,
    discountPercentage: 15,
    variantAttrs: ["color"],
    skuBase: "KPE",
    pexelsQuery: "embroidered pashmina",
    colors: [
      { ar: "كريمي", sku: "CRM" },
      { ar: "وردي فاتح", sku: "PNK" },
      { ar: "أزرق", sku: "BLU" },
      { ar: "خوخي", sku: "PCH" },
    ],
  },
  {
    id: "prod_kher-silk-classic",
    companyId: "comp_kher-zaman",
    categoryKey: "kher-silk",
    name: "شال حرير كلاسيك",
    nameEn: "Classic Silk Shawl",
    description: "شال حرير طبيعي بملمس فاخر ولمعة راقية، مثالي للمناسبات والإطلالات المسائية.",
    descriptionEn: "Natural silk shawl with a luxurious feel and elegant sheen — perfect for occasions and evenings.",
    price: 450,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "KSS",
    pexelsQuery: "silk shawl",
    colors: [
      { ar: "شامبين", sku: "CHM" },
      { ar: "أسود", sku: "BLK" },
      { ar: "عاجي", sku: "IVY" },
      { ar: "وردي", sku: "PNK" },
    ],
  },
  {
    id: "prod_kher-printed-silk",
    companyId: "comp_kher-zaman",
    categoryKey: "kher-silk",
    name: "شال حرير مطبوع",
    nameEn: "Printed Silk Shawl",
    description: "شال حرير بنقشة شرقية عصرية مطبوعة بدقة عالية، قطعة مميزة تُكمل إطلالتك.",
    descriptionEn: "Silk shawl with a modern oriental print at high precision — a distinctive piece to complete your look.",
    price: 520,
    discountPercentage: 10,
    variantAttrs: ["color"],
    skuBase: "KSP",
    pexelsQuery: "printed silk scarf",
    colors: [
      { ar: "أحمر", sku: "RED" },
      { ar: "أزرق", sku: "BLU" },
      { ar: "أخضر", sku: "GRN" },
      { ar: "خردلي", sku: "MST" },
    ],
  },
  {
    id: "prod_kher-leather-belt",
    companyId: "comp_kher-zaman",
    categoryKey: "kher-leather",
    name: "حزام جلد طبيعي",
    nameEn: "Natural Leather Belt",
    description: "حزام من الجلد الطبيعي المصري بتصميم كلاسيك وإبزيم نحاسي متين.",
    descriptionEn: "Belt of natural Egyptian leather in a classic design with a sturdy brass buckle.",
    price: 400,
    discountPercentage: 0,
    variantAttrs: ["color", "size"],
    skuBase: "KBL",
    pexelsQuery: "leather belt",
    colors: [
      { ar: "أسود", sku: "BLK" },
      { ar: "بني", sku: "BRN" },
    ],
    sizes: [
      { ar: "S", sku: "S" },
      { ar: "M", sku: "M" },
      { ar: "L", sku: "L" },
    ],
  },
  {
    id: "prod_okhtein-printed-scarf",
    companyId: "comp_okhtein",
    categoryKey: "okhtein-printed",
    name: "وشاح حرير مطبوع",
    nameEn: "Printed Silk Scarf",
    description: "وشاح حرير طبيعي بطبعة فنية بتصميم أوختين الحصري، مستوحى من الثقافة المصرية.",
    descriptionEn: "Natural silk scarf with an artistic exclusive Okhtein print inspired by Egyptian culture.",
    price: 480,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "OSP",
    pexelsQuery: "silk scarf print",
    colors: [
      { ar: "أوبورن", sku: "AUB" },
      { ar: "أخضر", sku: "GRN" },
      { ar: "خردلي", sku: "MST" },
      { ar: "أزرق", sku: "BLU" },
      { ar: "وردي", sku: "PNK" },
    ],
  },
  {
    id: "prod_okhtein-solid-scarf",
    companyId: "comp_okhtein",
    categoryKey: "okhtein-solid",
    name: "وشاح حرير سادة",
    nameEn: "Solid Silk Scarf",
    description: "وشاح حرير سادة بألوان هادئة وتشطيب عالي الحواف، أناقة بلا مجهود.",
    descriptionEn: "Solid silk scarf in calm colors with high-quality edges — effortless elegance.",
    price: 420,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "OSS",
    pexelsQuery: "solid silk scarf",
    colors: [
      { ar: "أسود", sku: "BLK" },
      { ar: "عاجي", sku: "IVY" },
      { ar: "بيج", sku: "BGE" },
      { ar: "رمادي", sku: "GRY" },
    ],
  },
  {
    id: "prod_okhtein-check-scarf",
    companyId: "comp_okhtein",
    categoryKey: "okhtein-printed",
    name: "وشاح حرير مربعات",
    nameEn: "Checkered Silk Scarf",
    description: "وشاح حرير بنقشة المربعات الكلاسيكية بحجم واسع، يصلح للإطلالات النهارية والمسائية.",
    descriptionEn: "Silk scarf in a classic check pattern in a wide size — works for day and evening looks.",
    price: 460,
    discountPercentage: 25,
    variantAttrs: ["color"],
    skuBase: "OSC",
    pexelsQuery: "checkered scarf",
    colors: [
      { ar: "رمادي", sku: "GRY" },
      { ar: "بني", sku: "BRN" },
      { ar: "أسود", sku: "BLK" },
      { ar: "أخضر", sku: "GRN" },
    ],
  },
  {
    id: "prod_okhtein-cotton-wrap",
    companyId: "comp_okhtein",
    categoryKey: "okhtein-cotton-wraps",
    name: "شال قطني صيفي",
    nameEn: "Summer Cotton Wrap",
    description: "شال قطن خفيف بمسامية عالية، مثالي لأجواء الصيف والسفر والجلوس على الشاطئ.",
    descriptionEn: "Lightweight breathable cotton wrap — ideal for summer, travel and the beach.",
    price: 130,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "OWR",
    pexelsQuery: "light summer scarf",
    colors: [
      { ar: "أبيض", sku: "WHT" },
      { ar: "سماوي", sku: "SKY" },
      { ar: "خوخي", sku: "PCH" },
      { ar: "أصفر", sku: "YLW" },
      { ar: "وردي", sku: "PNK" },
    ],
  },
  {
    id: "prod_concrete-cotton-bandana",
    companyId: "comp_concrete",
    categoryKey: "concrete-cotton-bandanas",
    name: "باندانا قطن",
    nameEn: "Cotton Bandana",
    description: "باندانا قطن مريحة بألوان متنوعة، مثالية للإطلالات الكاجوال والحفلات.",
    descriptionEn: "Comfortable cotton bandana in a range of colors — perfect for casual looks and events.",
    price: 60,
    discountPercentage: 0,
    variantAttrs: ["color", "size"],
    skuBase: "CBD",
    pexelsQuery: "cotton bandana",
    sizeExtra: { "70x70": 15 },
    colors: [
      { ar: "أحمر", sku: "RED" },
      { ar: "أزرق", sku: "BLU" },
      { ar: "أسود", sku: "BLK" },
      { ar: "أخضر", sku: "GRN" },
    ],
    sizes: [
      { ar: "55x55", sku: "55" },
      { ar: "70x70", sku: "70" },
    ],
  },
  {
    id: "prod_concrete-silk-bandana",
    companyId: "comp_concrete",
    categoryKey: "concrete-silk-bandanas",
    name: "باندانا حرير",
    nameEn: "Silk Bandana",
    description: "باندانا حرير ناعمة بملمس فاخر، لمسة راقية على أي إطلالة شبابية.",
    descriptionEn: "Soft silk bandana with a luxury feel — a classy touch on any youthful look.",
    price: 180,
    discountPercentage: 0,
    variantAttrs: ["color"],
    skuBase: "SBD",
    pexelsQuery: "silk bandana",
    colors: [
      { ar: "نبيتي", sku: "BUR" },
      { ar: "أخضر", sku: "GRN" },
      { ar: "أسود", sku: "BLK" },
      { ar: "بنفسجي", sku: "PRP" },
    ],
  },
  {
    id: "prod_concrete-printed-bandana",
    companyId: "comp_concrete",
    categoryKey: "concrete-cotton-bandanas",
    name: "باندانا مطبوعة",
    nameEn: "Printed Bandana",
    description: "باندانا قطن بنقشات طباعية جريئة من إصدارات كونكريت المحدودة.",
    descriptionEn: "Cotton bandana with bold printed patterns from Concrete's limited editions.",
    price: 75,
    discountPercentage: 10,
    variantAttrs: ["color"],
    skuBase: "PBD",
    pexelsQuery: "bandana print",
    colors: [
      { ar: "متعدد", sku: "MLT" },
      { ar: "أسود/أحمر", sku: "BLR" },
      { ar: "كحلي", sku: "NAV" },
      { ar: "خردلي", sku: "MST" },
    ],
  },
  {
    id: "prod_concrete-striped-cap",
    companyId: "comp_concrete",
    categoryKey: "concrete-caps",
    name: "قبعة ستريت",
    nameEn: "Street Cap",
    description: "قبعة قطن بتصميم ستريت عصري وشعار كونكريت المطرز، تناسب الجميع.",
    descriptionEn: "Cotton cap with a modern street design and Concrete's embroidered logo.",
    price: 220,
    discountPercentage: 0,
    variantAttrs: ["color", "size"],
    skuBase: "SCP",
    pexelsQuery: "baseball cap",
    colors: [
      { ar: "أسود", sku: "BLK" },
      { ar: "كحلي", sku: "NAV" },
      { ar: "بيج", sku: "BGE" },
    ],
    sizes: [
      { ar: "OS", sku: "OS" },
    ],
  },
  {
    id: "prod_concrete-neck-warmer",
    companyId: "comp_concrete",
    categoryKey: "concrete-neck",
    name: "غطاء رقبة صوف",
    nameEn: "Wool Neck Warmer",
    description: "غطاء رقبة صوف دائري بدفء ممتاز، مثالي لمشاوير الشتاء والعناية بالرقبة.",
    descriptionEn: "Circular wool neck warmer with excellent warmth — ideal for winter outings.",
    price: 140,
    discountPercentage: 15,
    variantAttrs: ["color"],
    skuBase: "WNW",
    pexelsQuery: "neck warmer",
    colors: [
      { ar: "أسود", sku: "BLK" },
      { ar: "رمادي", sku: "GRY" },
      { ar: "كحلي", sku: "NAV" },
      { ar: "نبيتي", sku: "BUR" },
      { ar: "أخضر", sku: "GRN" },
    ],
  },
];

function buildVariants(p) {
  const list = [];
  const sizes = p.sizes || [null];
  for (const c of p.colors) {
    for (const s of sizes) {
      const attrs = { color: c.ar };
      if (s) attrs.size = s.ar;
      const sku = s ? `${p.skuBase}-${c.sku}-${s.sku}` : `${p.skuBase}-${c.sku}`;
      list.push({
        sku,
        attrs,
        price: p.price + (s ? p.sizeExtra?.[s.ar] || 0 : 0),
        stock: 10 + ((list.length * 7) % 40),
      });
    }
  }
  return list;
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

const USERS = [
  { id: "user_owner", name: "محمد عبدالله", phone: "01000000001", role: "owner" },
  { id: "user_merchant", name: "أحمد السيد", phone: "01000000002", role: "merchant" },
  { id: "user_admin", name: "ياسمين محمود", phone: "01220757043", role: "admin" },
  { id: "user_client", name: "سارة محمد", phone: "01012345678", role: "client" },
  { id: "user_client2", name: "منى إبراهيم", phone: "01123456789", role: "client" },
  { id: "user_client3", name: "كريم فؤاد", phone: "01098765432", role: "client" },
];

const CUSTOMERS = [
  { id: "cust_1", name: "سارة محمد", phone: "01012345678", address: "مدينة نصر، القاهرة" },
  { id: "cust_2", name: "منى إبراهيم", phone: "01123456789", address: "المعادي، القاهرة" },
  { id: "cust_3", name: "كريم فؤاد", phone: "01098765432", address: "الإسكندرية، سموحة" },
  { id: "cust_4", name: "هند أشرف", phone: "01234567890", address: "طنطا، الغربية" },
];

const DISCOUNT_CODES = [
  { id: "dc_welcome", code: "WELCOME10", percentage: 10, maxUses: 100, scope: "all", scopeId: "" },
  { id: "dc_okhtein", code: "OKHTEIN20", percentage: 20, maxUses: 50, scope: "company", scopeId: "comp_okhtein" },
  { id: "dc_kher", code: "KHER15", percentage: 15, maxUses: 50, scope: "company", scopeId: "comp_kher-zaman" },
];

const PAYMENT_METHODS = [
  { id: "pm_cod", name: "الدفع عند الاستلام", nameEn: "Cash on Delivery", active: true },
  { id: "pm_vodafone", name: "فودافون كاش", nameEn: "Vodafone Cash", active: true },
  { id: "pm_instapay", name: "انستاباي", nameEn: "InstaPay", active: true },
  { id: "pm_card", name: "بطاقة بنكية", nameEn: "Bank Card", active: true },
];

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
  } catch {
    return [];
  }
}

function now() {
  return new Date().toISOString();
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

async function main() {
  const env = loadEnv();
  const pexelsKey = env.PEXELS_API_KEY || "";

  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);

  const tables = [
    "variants", "products", "categories", "companies",
    "users", "orders", "customers", "discountCodes", "paymentMethods",
  ];
  for (const t of tables) db.exec(`DELETE FROM ${t}`);

  /* ---- Companies (with logos) ---- */
  const insCompany = db.prepare(
    "INSERT INTO companies (id, name, nameEn, logo, description, descriptionEn, active, createdAt) VALUES (?,?,?,?,?,?,?,?)"
  );
  for (const c of COMPANIES) {
    let logo = "";
    if (pexelsKey) {
      const imgs = await searchPexels(pexelsKey, c.logoQuery);
      logo = await downloadLocal(imgs[0] || "", "logos");
    }
    insCompany.run(c.id, c.name, c.nameEn, logo, c.description, c.descriptionEn, c.active ? 1 : 0, now());
    console.log(`company: ${c.nameEn} ${logo ? "(logo ✓)" : "(no logo)"}`);
  }

  /* ---- Categories ---- */
  const insCategory = db.prepare(
    "INSERT INTO categories (id, companyId, name, nameEn, parentId, createdAt) VALUES (?,?,?,?,?,?)"
  );
  for (const c of CATEGORIES) {
    insCategory.run(c.id, c.companyId, c.name, c.nameEn, c.parent, now());
  }
  console.log(`categories: ${CATEGORIES.length}`);

  /* ---- Products + Variants ---- */
  const insProduct = db.prepare(
    "INSERT INTO products (id, companyId, categoryId, name, nameEn, description, descriptionEn, price, images, discountPercentage, variantAttrs, active, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
  );
  const insVariant = db.prepare(
    "INSERT INTO variants (id, productId, attrs, sku, price, stock, showStock, image, images, active, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  );

  for (const p of PRODUCTS) {
    const cat = CATEGORIES.find((c) => c.key === p.categoryKey);
    let images = [];
    if (pexelsKey) {
      const remote = await searchPexels(pexelsKey, p.pexelsQuery);
      images = await resolveImages(remote, "products");
      if (images.length === 0) console.log(`  ! no pexels images for "${p.pexelsQuery}"`);
    } else {
      console.log("  ! PEXELS_API_KEY not found, seeding without images");
    }

    insProduct.run(
      p.id, p.companyId, cat.id, p.name, p.nameEn, p.description, p.descriptionEn,
      p.price, JSON.stringify(images), p.discountPercentage,
      JSON.stringify(p.variantAttrs), 1, now()
    );

    let i = 0;
    const list = buildVariants(p);
    for (const v of list) {
      const vImages = variantGallery(images, i);
      insVariant.run(
        `${p.id}#${i}`, p.id, JSON.stringify(v.attrs), v.sku, v.price, v.stock,
        1, vImages[0] || "", JSON.stringify(vImages), 1, now()
      );
      i++;
    }
    console.log(`product: ${p.nameEn} (${images.length} imgs, ${list.length} variants)`);
  }

  /* ---- Users ---- */
  const insUser = db.prepare(
    "INSERT INTO users (id, name, phone, role, createdAt) VALUES (?,?,?,?,?)"
  );
  for (const u of USERS) {
    insUser.run(u.id, u.name, u.phone, u.role, now());
  }
  console.log(`users: ${USERS.length}`);

  /* ---- Customers ---- */
  const insCustomer = db.prepare(
    "INSERT INTO customers (id, name, phone, address, createdAt) VALUES (?,?,?,?,?)"
  );
  for (const c of CUSTOMERS) {
    insCustomer.run(c.id, c.name, c.phone, c.address, daysAgo(5));
  }
  console.log(`customers: ${CUSTOMERS.length}`);

  /* ---- Sample Orders ---- */
  const insOrder = db.prepare(
    "INSERT INTO orders (id, customerId, customerName, customerPhone, items, total, finalTotal, status, createdAt) VALUES (?,?,?,?,?,?,?,?,?)"
  );
  const orderSeeds = [
    {
      id: "ord_1001",
      customerId: "user_client",
      customerName: "سارة محمد",
      customerPhone: "01012345678",
      createdAt: daysAgo(1),
      status: "pending",
      items: [
        { variantId: "prod_misr-cotton-scarf#0", productId: "prod_misr-cotton-scarf", name: "إيشارب قطن مصري 100%", price: 95, quantity: 2, image: "", attrs: { color: "أبيض" } },
        { variantId: "prod_misr-royal-wool#0", productId: "prod_misr-royal-wool", name: "شال صوف ملكي", price: 380, discountPercentage: 20, quantity: 1, image: "", attrs: { color: "أسود", size: "150x150" } },
      ],
    },
    {
      id: "ord_1002",
      customerId: "user_client2",
      customerName: "منى إبراهيم",
      customerPhone: "01123456789",
      createdAt: daysAgo(3),
      status: "processing",
      items: [
        { variantId: "prod_okhtein-printed-scarf#0", productId: "prod_okhtein-printed-scarf", name: "وشاح حرير مطبوع", price: 480, quantity: 1, image: "", attrs: { color: "أوبورن" } },
        { variantId: "prod_concrete-cotton-bandana#0", productId: "prod_concrete-cotton-bandana", name: "باندانا قطن", price: 60, quantity: 3, image: "", attrs: { color: "أحمر", size: "55x55" } },
      ],
    },
    {
      id: "ord_1003",
      customerId: "user_client3",
      customerName: "كريم فؤاد",
      customerPhone: "01098765432",
      createdAt: daysAgo(6),
      status: "delivered",
      items: [
        { variantId: "prod_kher-pashmina#0", productId: "prod_kher-pashmina", name: "باشمينا كشمير", price: 550, quantity: 1, image: "", attrs: { color: "بيج" } },
        { variantId: "prod_concrete-striped-cap#0", productId: "prod_concrete-striped-cap", name: "قبعة ستريت", price: 220, quantity: 1, image: "", attrs: { size: "OS" } },
      ],
    },
  ];
  for (const o of orderSeeds) {
    const total = o.items.reduce((s, it) => s + it.price * it.quantity, 0);
    insOrder.run(o.id, o.customerId, o.customerName, o.customerPhone, JSON.stringify(o.items), total, total, o.status, o.createdAt);
  }
  console.log(`orders: ${orderSeeds.length}`);

  /* ---- Discount Codes ---- */
  const insCode = db.prepare(
    "INSERT INTO discountCodes (id, code, percentage, active, maxUses, scope, scopeId, createdAt) VALUES (?,?,?,?,?,?,?,?)"
  );
  for (const d of DISCOUNT_CODES) {
    insCode.run(d.id, d.code, d.percentage, 1, d.maxUses, d.scope, d.scopeId, now());
  }
  console.log(`discountCodes: ${DISCOUNT_CODES.length}`);

  /* ---- Payment Methods ---- */
  const insPm = db.prepare(
    "INSERT INTO paymentMethods (id, name, nameEn, active, createdAt) VALUES (?,?,?,?,?)"
  );
  for (const p of PAYMENT_METHODS) {
    insPm.run(p.id, p.name, p.nameEn, p.active ? 1 : 0, now());
  }
  console.log(`paymentMethods: ${PAYMENT_METHODS.length}`);

  db.close();
  console.log(`\nSeed complete. DB written to ${DB_PATH}`);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
