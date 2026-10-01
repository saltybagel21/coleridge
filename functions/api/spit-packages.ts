import { legacySpitPackagePrices, listSpitPackageConfig } from "../_shared/spitPackages";
import { noStoreJson } from "../_shared/http";
import type { Env } from "../_shared/types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const config = await listSpitPackageConfig(env.DB);
    return noStoreJson({ config, prices: legacySpitPackagePrices(config) });
  } catch (error) {
    console.error("Unable to load spit package prices", error);
    return noStoreJson({ error: "Spit package prices are temporarily unavailable." }, { status: 503 });
  }
};
