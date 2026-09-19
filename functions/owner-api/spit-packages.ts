import { listSpitPackagePrices, updateSpitPackagePrice } from "../_shared/spitPackages";
import { noStoreJson } from "../_shared/http";
import type { Env } from "../_shared/types";
import { SPIT_PACKAGES, type SpitPackageId } from "../../src/shared/spitPackages";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    return noStoreJson({ prices: await listSpitPackagePrices(env.DB) });
  } catch (error) {
    console.error("Unable to load owner spit package prices", error);
    return noStoreJson({ error: "Spit package prices could not be loaded." }, { status: 503 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  let input: { id?: unknown; price?: unknown };
  try {
    input = await request.json();
  } catch {
    return noStoreJson({ error: "Enter a valid package price." }, { status: 400 });
  }

  const id = input?.id;
  const price = input?.price;
  if (typeof id !== "string" || !SPIT_PACKAGES.some((pkg) => pkg.id === id)) {
    return noStoreJson({ error: "Choose a valid spit package." }, { status: 400 });
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 1_000_000 || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) {
    return noStoreJson({ error: "Enter a price between R0 and R1,000,000 with no more than two decimal places." }, { status: 400 });
  }

  try {
    await updateSpitPackagePrice(env.DB, id as SpitPackageId, price);
    return noStoreJson({ prices: await listSpitPackagePrices(env.DB) });
  } catch (error) {
    console.error("Unable to update spit package price", error);
    return noStoreJson({ error: "The price could not be saved." }, { status: 503 });
  }
};
