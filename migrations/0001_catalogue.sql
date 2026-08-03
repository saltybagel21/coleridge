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
);

CREATE INDEX IF NOT EXISTS idx_products_visible_order
  ON products(enabled, sort_order, name);
