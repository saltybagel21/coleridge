CREATE TABLE IF NOT EXISTS spit_package_prices (
  package_id TEXT PRIMARY KEY,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0 AND price_cents <= 100000000),
  updated_at TEXT NOT NULL
);
