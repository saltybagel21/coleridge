import {
  legacySpitPackagePrices,
  listSpitPackageConfig,
  saveSpitPackageConfig,
  validateSpitPackageConfig,
} from "../_shared/spitPackages";
import { noStoreJson } from "../_shared/http";
import type { Env } from "../_shared/types";
import { SPIT_PACKAGE_IDS } from "../../src/shared/spitPackages";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const config = await listSpitPackageConfig(env.DB);
    return noStoreJson({ config, prices: legacySpitPackagePrices(config) });
  } catch (error) {
    console.error("Unable to load owner spit packages", error);
    return noStoreJson({ error: "Spit packages could not be loaded." }, { status: 503 });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  let config;
  try {
    config = validateSpitPackageConfig(await request.json());
  } catch (error) {
    return noStoreJson({ error: error instanceof Error ? error.message : "Invalid package details." }, { status: 400 });
  }

  try {
    await saveSpitPackageConfig(env.DB, config);
    return noStoreJson({ config, prices: legacySpitPackagePrices(config) });
  } catch (error) {
    console.error("Unable to save spit packages", error);
    return noStoreJson({ error: "The packages could not be saved." }, { status: 503 });
  }
};

// Existing owner tabs can still save a single price until they reload.
export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  let input: { id?: unknown; price?: unknown };
  try {
    input = await request.json();
  } catch {
    return noStoreJson({ error: "Enter a valid package price." }, { status: 400 });
  }

  const id = input?.id;
  const price = input?.price;
  if (typeof id !== "string" || !SPIT_PACKAGE_IDS.slice(0, 3).some((packageId) => packageId === id)) {
    return noStoreJson({ error: "Choose a valid spit package." }, { status: 400 });
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0 || price > 1_000_000 || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) {
    return noStoreJson({ error: "Enter a price above R0 and up to R1,000,000 with no more than two decimal places." }, { status: 400 });
  }

  try {
    const config = await listSpitPackageConfig(env.DB);
    config.packages.find((entry) => entry.id === id)!.price = price;
    await saveSpitPackageConfig(env.DB, validateSpitPackageConfig(config));
    return noStoreJson({ config, prices: legacySpitPackagePrices(config) });
  } catch (error) {
    console.error("Unable to update spit package price", error);
    return noStoreJson({ error: "The price could not be saved." }, { status: 503 });
  }
};
