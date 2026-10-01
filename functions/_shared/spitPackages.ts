import {
  defaultSpitPackageConfig,
  SPIT_PACKAGE_IDS,
  type SpitPackage,
  type SpitPackageConfig,
  type SpitPackageId,
} from "../../src/shared/spitPackages";

const ensureLegacyPriceTable = (db: D1Database) =>
  db.prepare(`CREATE TABLE IF NOT EXISTS spit_package_prices (
    package_id TEXT PRIMARY KEY,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0 AND price_cents <= 100000000),
    updated_at TEXT NOT NULL
  )`).run();

const ensureConfigTable = (db: D1Database) =>
  db.prepare(`CREATE TABLE IF NOT EXISTS spit_package_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();

export const validateSpitPackageConfig = (value: unknown): SpitPackageConfig => {
  if (!value || typeof value !== "object") throw new Error("Invalid package configuration.");
  const input = value as Record<string, unknown>;
  const legacyCount = input.visibleCount;
  if (legacyCount !== undefined && (!Number.isInteger(legacyCount) || (legacyCount as number) < 2 || (legacyCount as number) > 6)) {
    throw new Error("Choose between 2 and 6 packages.");
  }
  const visibleIds = input.visibleIds === undefined && Number.isInteger(legacyCount)
    ? SPIT_PACKAGE_IDS.slice(0, legacyCount as number)
    : input.visibleIds;
  if (!Array.isArray(visibleIds) || visibleIds.length < 2 || visibleIds.length > 6 ||
      new Set(visibleIds).size !== visibleIds.length ||
      visibleIds.some((id) => !SPIT_PACKAGE_IDS.includes(id as SpitPackageId))) {
    throw new Error("Choose 2 to 6 different packages to show.");
  }
  if (legacyCount !== undefined && legacyCount !== visibleIds.length) {
    throw new Error("Package visibility has changed. Reload and try again.");
  }
  if (!Array.isArray(input.packages) || input.packages.length !== 6) {
    throw new Error("All six package slots are required.");
  }

  const packages: SpitPackage[] = input.packages.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid package details.");
    const entry = raw as Record<string, unknown>;
    if (entry.id !== SPIT_PACKAGE_IDS[index]) throw new Error("Package order is invalid.");
    const name = typeof entry.name === "string" ? entry.name.trim().replace(/\s+/g, " ") : "";
    const shortDescription = typeof entry.shortDescription === "string"
      ? entry.shortDescription.trim().replace(/\s+/g, " ") : "";
    const note = typeof entry.note === "string" ? entry.note.trim() : "";
    const price = entry.price;
    if (!name || name.length > 60) throw new Error(`Enter a name of up to 60 characters for package ${index + 1}.`);
    if (shortDescription.length > 90) throw new Error(`The short line for package ${index + 1} is too long.`);
    if (note.length > 500) throw new Error(`The note for package ${index + 1} is too long.`);
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 1_000_000 || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) {
      throw new Error(`Enter a valid price for package ${index + 1}.`);
    }
    if (visibleIds.includes(entry.id) && price <= 0) {
      throw new Error(`Set a price above R0 for package ${index + 1} before showing it.`);
    }
    if (!Array.isArray(entry.included) || entry.included.length > 16 || entry.included.some((item) => typeof item !== "string" || !item.trim() || item.trim().length > 120)) {
      throw new Error(`Enter up to 16 included items for package ${index + 1}, one per line.`);
    }
    return {
      id: entry.id as SpitPackageId,
      name,
      price: Math.round(price * 100) / 100,
      shortDescription,
      included: (entry.included as string[]).map((item) => item.trim()),
      note,
    };
  });

  return { visibleCount: visibleIds.length, visibleIds: visibleIds as SpitPackageId[], packages };
};

export const listSpitPackageConfig = async (db: D1Database): Promise<SpitPackageConfig> => {
  await ensureConfigTable(db);
  const saved = await db.prepare("SELECT config_json FROM spit_package_config WHERE id = 1").first<{ config_json: string }>();
  if (saved) return validateSpitPackageConfig(JSON.parse(saved.config_json));

  await ensureLegacyPriceTable(db);
  const config = defaultSpitPackageConfig();
  const previousPrices = await db.prepare("SELECT package_id, price_cents FROM spit_package_prices").all<{
    package_id: string;
    price_cents: number;
  }>();
  for (const row of previousPrices.results ?? []) {
    const pkg = config.packages.find((entry) => entry.id === row.package_id);
    if (pkg) pkg.price = row.price_cents / 100;
  }
  return config;
};

export const saveSpitPackageConfig = async (db: D1Database, config: SpitPackageConfig) => {
  await ensureConfigTable(db);
  await db.prepare(`INSERT INTO spit_package_config (id, config_json, updated_at) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET config_json = excluded.config_json, updated_at = excluded.updated_at`)
    .bind(JSON.stringify(config), new Date().toISOString())
    .run();
};

export const legacySpitPackagePrices = (config: SpitPackageConfig) =>
  Object.fromEntries(config.packages.map((pkg) => [pkg.id, pkg.price]));
