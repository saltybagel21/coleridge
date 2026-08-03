import { PUBLIC_PRODUCTS } from "../../src/shop/products";
import type { Product, StockStatus, Unit } from "../../src/shop/products";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  price_label: string | null;
  unit: Unit;
  note: string | null;
  min_qty: number | null;
  qty_step: number | null;
  max_qty: number | null;
  stock_status: StockStatus;
  enabled: number;
  sort_order: number;
};

const CREATE_PRODUCTS = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
    price_label TEXT,
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'each')),
    note TEXT,
    min_qty REAL,
    qty_step REAL,
    max_qty REAL,
    stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock')),
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const PRODUCT_COLUMNS = [
  "id",
  "name",
  "category",
  "price",
  "price_label",
  "unit",
  "note",
  "min_qty",
  "qty_step",
  "max_qty",
  "stock_status",
  "enabled",
  "sort_order",
  "created_at",
  "updated_at",
];

const toDatabaseValues = (product: Product, now: string) => [
  product.id,
  product.name,
  product.category,
  product.price,
  product.priceLabel ?? null,
  product.unit,
  product.note ?? null,
  product.minQty ?? null,
  product.qtyStep ?? null,
  product.maxQty ?? null,
  product.stockStatus ?? "in_stock",
  product.enabled === false ? 0 : 1,
  product.sortOrder ?? 0,
  now,
  now,
];

const rowToProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  category: row.category,
  price: row.price,
  ...(row.price_label ? { priceLabel: row.price_label } : {}),
  unit: row.unit,
  ...(row.note ? { note: row.note } : {}),
  ...(row.min_qty != null ? { minQty: row.min_qty } : {}),
  ...(row.qty_step != null ? { qtyStep: row.qty_step } : {}),
  ...(row.max_qty != null ? { maxQty: row.max_qty } : {}),
  stockStatus: row.stock_status,
  enabled: row.enabled === 1,
  sortOrder: row.sort_order,
});

let catalogueReady: Promise<void> | undefined;

const initialiseCatalogue = async (db: D1Database) => {
  await db.prepare(CREATE_PRODUCTS).run();
  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_products_visible_order ON products(enabled, sort_order, name)")
    .run();

  const count = await db.prepare("SELECT COUNT(*) AS total FROM products").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;

  const now = new Date().toISOString();
  const rowsPerStatement = 6;
  const statements: D1PreparedStatement[] = [];

  for (let index = 0; index < PUBLIC_PRODUCTS.length; index += rowsPerStatement) {
    const products = PUBLIC_PRODUCTS.slice(index, index + rowsPerStatement);
    const placeholders = products
      .map(() => `(${PRODUCT_COLUMNS.map(() => "?").join(", ")})`)
      .join(", ");
    const sql = `INSERT OR IGNORE INTO products (${PRODUCT_COLUMNS.join(", ")}) VALUES ${placeholders}`;
    const values = products.flatMap((product) => toDatabaseValues(product, now));
    statements.push(db.prepare(sql).bind(...values));
  }

  await db.batch(statements);
};

export const ensureCatalogue = (db: D1Database) => {
  if (!catalogueReady) {
    catalogueReady = initialiseCatalogue(db).catch((error) => {
      catalogueReady = undefined;
      throw error;
    });
  }
  return catalogueReady;
};

export const listProducts = async (db: D1Database, includeDisabled = false) => {
  await ensureCatalogue(db);
  const where = includeDisabled ? "" : "WHERE enabled = 1";
  const result = await db
    .prepare(`SELECT * FROM products ${where} ORDER BY sort_order ASC, name COLLATE NOCASE ASC`)
    .all<ProductRow>();
  return result.results.map(rowToProduct);
};

export const getProduct = async (db: D1Database, id: string) => {
  const row = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first<ProductRow>();
  return row ? rowToProduct(row) : null;
};

export const nextSortOrder = async (db: D1Database) => {
  const result = await db.prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM products").first<{ next: number }>();
  return result?.next ?? 1;
};

export const insertProduct = async (db: D1Database, product: Product) => {
  await ensureCatalogue(db);
  const now = new Date().toISOString();
  const placeholders = PRODUCT_COLUMNS.map(() => "?").join(", ");
  await db
    .prepare(`INSERT INTO products (${PRODUCT_COLUMNS.join(", ")}) VALUES (${placeholders})`)
    .bind(...toDatabaseValues(product, now))
    .run();
  return getProduct(db, product.id);
};

export const updateProduct = async (db: D1Database, id: string, product: Product) => {
  await ensureCatalogue(db);
  await db
    .prepare(`
      UPDATE products SET
        name = ?, category = ?, price = ?, price_label = ?, unit = ?, note = ?,
        min_qty = ?, qty_step = ?, max_qty = ?, stock_status = ?, enabled = ?,
        sort_order = ?, updated_at = ?
      WHERE id = ?
    `)
    .bind(
      product.name,
      product.category,
      product.price,
      product.priceLabel ?? null,
      product.unit,
      product.note ?? null,
      product.minQty ?? null,
      product.qtyStep ?? null,
      product.maxQty ?? null,
      product.stockStatus ?? "in_stock",
      product.enabled === false ? 0 : 1,
      product.sortOrder ?? 0,
      new Date().toISOString(),
      id,
    )
    .run();
  return getProduct(db, id);
};

export const deleteProduct = async (db: D1Database, id: string) => {
  await ensureCatalogue(db);
  const result = await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
};
