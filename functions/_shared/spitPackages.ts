import {
  defaultSpitPackagePrices,
  SPIT_PACKAGES,
  type SpitPackageId,
  type SpitPackagePrices,
} from "../../src/shared/spitPackages";

const ensureTable = (db: D1Database) =>
  db.prepare(`CREATE TABLE IF NOT EXISTS spit_package_prices (
    package_id TEXT PRIMARY KEY,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0 AND price_cents <= 100000000),
    updated_at TEXT NOT NULL
  )`).run();

export const listSpitPackagePrices = async (db: D1Database): Promise<SpitPackagePrices> => {
  await ensureTable(db);
  const rows = await db.prepare("SELECT package_id, price_cents FROM spit_package_prices").all<{
    package_id: string;
    price_cents: number;
  }>();
  const prices = defaultSpitPackagePrices();
  for (const row of rows.results ?? []) {
    if (SPIT_PACKAGES.some((pkg) => pkg.id === row.package_id)) {
      prices[row.package_id as SpitPackageId] = row.price_cents / 100;
    }
  }
  return prices;
};

export const updateSpitPackagePrice = async (db: D1Database, id: SpitPackageId, price: number) => {
  await ensureTable(db);
  await db.prepare(`INSERT INTO spit_package_prices (package_id, price_cents, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(package_id) DO UPDATE SET price_cents = excluded.price_cents, updated_at = excluded.updated_at`)
    .bind(id, Math.round(price * 100), new Date().toISOString())
    .run();
};
