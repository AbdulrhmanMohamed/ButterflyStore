import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Company, Category, Product, Variant, User, Order, DiscountCode, PaymentMethod, Customer,
} from "./types";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "butterfly.db");

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  ensureColumn("variants", "images", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn("orders", "address", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("orders", "paymentMethod", "TEXT NOT NULL DEFAULT ''");
  return db;
}

function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db!.prepare(`PRAGMA table_info(${table})`).all() as any[];
  if (!cols.some((c) => c.name === column)) {
    db!.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

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

function now(): string {
  return new Date().toISOString();
}

function parseJson(value: string | null | undefined, fallback: any) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function rows<T>(stmt: any, ...params: any[]): T[] {
  return (stmt.all(...params) as any[]).map(rowMap as any) as T[];
}

function rowMap(r: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...r };
  if (typeof out.active === "number") out.active = out.active === 1;
  if (typeof out.showStock === "number") out.showStock = out.showStock === 1;
  if (typeof out.images === "string") out.images = parseJson(out.images, []);
  if (typeof out.variantAttrs === "string") out.variantAttrs = parseJson(out.variantAttrs, []);
  if (typeof out.attrs === "string") out.attrs = parseJson(out.attrs, {});
  if (typeof out.items === "string") out.items = parseJson(out.items, []);
  return out;
}

function bool(v: any): number {
  return v === false ? 0 : 1;
}

export const companies = {
  list: (): Company[] => rows<Company>(getDb().prepare("SELECT * FROM companies ORDER BY name ASC")),
  get: (id: string): Company | null => {
    const r = getDb().prepare("SELECT * FROM companies WHERE id = ?").get(id);
    return r ? (rowMap(r) as Company) : null;
  },
  create: (data: Partial<Company>) => {
    const id = randomUUID();
    getDb().prepare(
      "INSERT INTO companies (id, name, nameEn, logo, description, descriptionEn, active, createdAt) VALUES (?,?,?,?,?,?,?,?)"
    ).run(id, data.name || "", data.nameEn || "", data.logo || "", data.description || "", data.descriptionEn || "", bool(data.active), now());
    return { id };
  },
  update: (id: string, data: Partial<Company>) => {
    getDb().prepare(
      "UPDATE companies SET name=?, nameEn=?, logo=?, description=?, descriptionEn=?, active=? WHERE id=?"
    ).run(data.name ?? "", data.nameEn ?? "", data.logo ?? "", data.description ?? "", data.descriptionEn ?? "", data.active === undefined ? undefined : bool(data.active), id);
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM companies WHERE id = ?").run(id);
  },
};

export const categories = {
  list: (): Category[] => rows<Category>(getDb().prepare("SELECT * FROM categories ORDER BY name ASC")),
  get: (id: string): Category | null => {
    const r = getDb().prepare("SELECT * FROM categories WHERE id = ?").get(id);
    return r ? (rowMap(r) as Category) : null;
  },
  create: (data: Partial<Category>) => {
    const id = randomUUID();
    getDb().prepare(
      "INSERT INTO categories (id, companyId, name, nameEn, parentId, createdAt) VALUES (?,?,?,?,?,?)"
    ).run(id, data.companyId || "", data.name || "", data.nameEn || "", data.parentId ?? null, now());
    return { id };
  },
  update: (id: string, data: Partial<Category>) => {
    getDb().prepare(
      "UPDATE categories SET companyId=?, name=?, nameEn=?, parentId=? WHERE id=?"
    ).run(data.companyId ?? "", data.name ?? "", data.nameEn ?? "", data.parentId ?? null, id);
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM categories WHERE id = ?").run(id);
  },
  byCompany: (companyId: string): Category[] =>
    rows<Category>(getDb().prepare("SELECT * FROM categories WHERE companyId = ? ORDER BY name ASC"), companyId),
};

export const products = {
  list: (pageSize = 100): Product[] => rows<Product>(
    getDb().prepare("SELECT * FROM products ORDER BY name ASC LIMIT ?"), pageSize
  ),
  get: (id: string): Product | null => {
    const r = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id);
    return r ? (rowMap(r) as Product) : null;
  },
  create: (data: Partial<Product>) => {
    const id = randomUUID();
    getDb().prepare(
      "INSERT INTO products (id, companyId, categoryId, name, nameEn, description, descriptionEn, price, images, discountPercentage, variantAttrs, active, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).run(
      id, data.companyId || "", data.categoryId || "", data.name || "", data.nameEn || "",
      data.description || "", data.descriptionEn || "", data.price ?? 0,
      JSON.stringify(data.images || []), data.discountPercentage ?? 0,
      JSON.stringify(data.variantAttrs || []), bool(data.active), now()
    );
    return { id };
  },
  update: (id: string, data: Partial<Product>) => {
    getDb().prepare(
      "UPDATE products SET companyId=?, categoryId=?, name=?, nameEn=?, description=?, descriptionEn=?, price=?, images=?, discountPercentage=?, variantAttrs=?, active=? WHERE id=?"
    ).run(
      data.companyId ?? "", data.categoryId ?? "", data.name ?? "", data.nameEn ?? "",
      data.description ?? "", data.descriptionEn ?? "", data.price ?? 0,
      JSON.stringify(data.images || []), data.discountPercentage ?? 0,
      JSON.stringify(data.variantAttrs || []), data.active === undefined ? undefined : bool(data.active), id
    );
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
    getDb().prepare("DELETE FROM variants WHERE productId = ?").run(id);
  },
  byCategory: (categoryId: string): Product[] =>
    rows<Product>(getDb().prepare("SELECT * FROM products WHERE categoryId = ? ORDER BY name ASC"), categoryId),
  byCompany: (companyId: string): Product[] =>
    rows<Product>(getDb().prepare("SELECT * FROM products WHERE companyId = ? ORDER BY name ASC"), companyId),
};

export const variants = {
  list: (pageSize = 200): Variant[] => rows<Variant>(
    getDb().prepare("SELECT * FROM variants LIMIT ?"), pageSize
  ),
  get: (id: string): Variant | null => {
    const r = getDb().prepare("SELECT * FROM variants WHERE id = ?").get(id);
    return r ? (rowMap(r) as Variant) : null;
  },
  create: (data: Partial<Variant>) => {
    const id = randomUUID();
    const images = data.images?.length ? data.images : data.image ? [data.image] : [];
    getDb().prepare(
      "INSERT INTO variants (id, productId, attrs, sku, price, stock, showStock, image, images, active, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    ).run(
      id, data.productId || "", JSON.stringify(data.attrs || {}), data.sku || "",
      data.price ?? 0, data.stock ?? 0, bool(data.showStock), data.image || "", JSON.stringify(images), bool(data.active), now()
    );
    return { id };
  },
  update: (id: string, data: Partial<Variant>) => {
    const images = data.images?.length ? data.images : data.image ? [data.image] : [];
    getDb().prepare(
      "UPDATE variants SET productId=?, attrs=?, sku=?, price=?, stock=?, showStock=?, image=?, images=?, active=? WHERE id=?"
    ).run(
      data.productId ?? "", JSON.stringify(data.attrs || {}), data.sku ?? "",
      data.price ?? 0, data.stock ?? 0, data.showStock === undefined ? undefined : bool(data.showStock),
      data.image || "", JSON.stringify(images), data.active === undefined ? undefined : bool(data.active), id
    );
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM variants WHERE id = ?").run(id);
  },
  byProduct: (productId: string): Variant[] =>
    rows<Variant>(getDb().prepare("SELECT * FROM variants WHERE productId = ?"), productId),
  byProductBatch: (productIds: string[]): Map<string, Variant[]> => {
    const map = new Map<string, Variant[]>();
    if (productIds.length === 0) return map;
    const placeholders = productIds.map(() => "?").join(",");
    const all = rows<Variant>(
      getDb().prepare(`SELECT * FROM variants WHERE productId IN (${placeholders})`),
      ...productIds
    );
    for (const v of all) {
      const list = map.get(v.productId) || [];
      list.push(v);
      map.set(v.productId, list);
    }
    return map;
  },
};

export const users = {
  list: (): User[] => rows<User>(getDb().prepare("SELECT * FROM users ORDER BY createdAt DESC")),
  get: (id: string): User | null => {
    const r = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
    return r ? (rowMap(r) as User) : null;
  },
  byPhone: (phone: string): User | null => {
    const r = getDb().prepare("SELECT * FROM users WHERE phone = ? LIMIT 1").get(phone);
    return r ? (rowMap(r) as User) : null;
  },
  create: (data: Partial<User>) => {
    const id = randomUUID();
    getDb().prepare("INSERT INTO users (id, name, phone, role, createdAt) VALUES (?,?,?,?,?)")
      .run(id, data.name || "", data.phone || "", data.role || "client", now());
    return { id };
  },
  update: (id: string, data: Partial<User>) => {
    getDb().prepare("UPDATE users SET name=?, phone=?, role=? WHERE id=?")
      .run(data.name ?? "", data.phone ?? "", data.role ?? "client", id);
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
  },
};

export const orders = {
  list: (pageSize = 50): Order[] => rows<Order>(
    getDb().prepare("SELECT * FROM orders ORDER BY createdAt DESC LIMIT ?"), pageSize
  ),
  get: (id: string): Order | null => {
    const r = getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id);
    return r ? (rowMap(r) as Order) : null;
  },
  create: (data: Partial<Order>) => {
    const id = randomUUID();
    getDb().prepare(
      "INSERT INTO orders (id, customerId, customerName, customerPhone, address, paymentMethod, items, total, finalTotal, status, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    ).run(
      id, data.customerId || "", data.customerName || "", data.customerPhone || "",
      data.address || "", data.paymentMethod || "",
      JSON.stringify(data.items || []), data.total ?? 0, data.finalTotal ?? 0, data.status || "pending", now()
    );
    return { id };
  },
  update: (id: string, data: Partial<Order>) => {
    getDb().prepare(
      "UPDATE orders SET customerName=?, customerPhone=?, address=?, paymentMethod=?, items=?, total=?, finalTotal=?, status=? WHERE id=?"
    ).run(
      data.customerName ?? "", data.customerPhone ?? "", data.address ?? "", data.paymentMethod ?? "",
      JSON.stringify(data.items || []), data.total ?? 0, data.finalTotal ?? 0, data.status || "pending", id
    );
  },
};

export const customers = {
  list: (pageSize = 50): Customer[] => rows<Customer>(
    getDb().prepare("SELECT * FROM customers ORDER BY name ASC LIMIT ?"), pageSize
  ),
  get: (id: string): Customer | null => {
    const r = getDb().prepare("SELECT * FROM customers WHERE id = ?").get(id);
    return r ? (rowMap(r) as Customer) : null;
  },
  create: (data: Partial<Customer>) => {
    const id = randomUUID();
    getDb().prepare("INSERT INTO customers (id, name, phone, address, createdAt) VALUES (?,?,?,?,?)")
      .run(id, data.name || "", data.phone || "", data.address || "", now());
    return { id };
  },
  update: (id: string, data: Partial<Customer>) => {
    getDb().prepare("UPDATE customers SET name=?, phone=?, address=? WHERE id=?").run(data.name ?? "", data.phone ?? "", data.address ?? "", id);
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM customers WHERE id = ?").run(id);
  },
};

export const discountCodes = {
  list: (): DiscountCode[] => rows<DiscountCode>(getDb().prepare("SELECT * FROM discountCodes")),
  get: (id: string): DiscountCode | null => {
    const r = getDb().prepare("SELECT * FROM discountCodes WHERE id = ?").get(id);
    return r ? (rowMap(r) as DiscountCode) : null;
  },
  create: (data: Partial<DiscountCode>) => {
    const id = randomUUID();
    getDb().prepare("INSERT INTO discountCodes (id, code, percentage, active, maxUses, scope, scopeId, createdAt) VALUES (?,?,?,?,?,?,?,?)")
      .run(id, data.code || "", data.percentage ?? 0, bool(data.active), data.maxUses ?? 0, data.scope ?? "", data.scopeId ?? "", now());
    return { id };
  },
  update: (id: string, data: Partial<DiscountCode>) => {
    getDb().prepare("UPDATE discountCodes SET code=?, percentage=?, active=?, maxUses=?, scope=?, scopeId=? WHERE id=?")
      .run(data.code ?? "", data.percentage ?? 0, data.active === undefined ? undefined : bool(data.active), data.maxUses ?? 0, data.scope ?? "", data.scopeId ?? "", id);
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM discountCodes WHERE id = ?").run(id);
  },
};

export const paymentMethods = {
  list: (): PaymentMethod[] => rows<PaymentMethod>(getDb().prepare("SELECT * FROM paymentMethods ORDER BY name ASC")),
  get: (id: string): PaymentMethod | null => {
    const r = getDb().prepare("SELECT * FROM paymentMethods WHERE id = ?").get(id);
    return r ? (rowMap(r) as PaymentMethod) : null;
  },
  create: (data: Partial<PaymentMethod>) => {
    const id = randomUUID();
    getDb().prepare("INSERT INTO paymentMethods (id, name, nameEn, active, createdAt) VALUES (?,?,?,?,?)")
      .run(id, data.name || "", data.nameEn || "", bool(data.active), now());
    return { id };
  },
  update: (id: string, data: Partial<PaymentMethod>) => {
    getDb().prepare("UPDATE paymentMethods SET name=?, nameEn=?, active=? WHERE id=?")
      .run(data.name ?? "", data.nameEn ?? "", data.active === undefined ? undefined : bool(data.active), id);
  },
  delete: (id: string) => {
    getDb().prepare("DELETE FROM paymentMethods WHERE id = ?").run(id);
  },
};

export function getCatalog() {
  return {
    companies: companies.list(),
    categories: categories.list(),
    products: products.list(),
    variants: variants.list(),
  };
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
