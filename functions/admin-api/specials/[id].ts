import { noStoreJson } from "../../_shared/http";
import {
  deleteSpecialCampaign,
  getSpecialCampaign,
  updateSpecialCampaign,
  validateSpecialCampaign,
} from "../../_shared/specials";
import type { Env } from "../../_shared/types";

export const onRequestPatch: PagesFunction<Env, "id"> = async ({ request, env, params }) => {
  try {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return noStoreJson({ error: "Campaign ID is required." }, { status: 400 });
    const current = await getSpecialCampaign(env.DB, id);
    if (!current) return noStoreJson({ error: "Campaign not found." }, { status: 404 });

    const body: unknown = await request.json();
    const validation = validateSpecialCampaign(body, {
      id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    });
    if ("error" in validation) return noStoreJson({ error: validation.error }, { status: 400 });

    const campaign = await updateSpecialCampaign(env.DB, validation.campaign);
    return noStoreJson({ campaign });
  } catch (error) {
    console.error("Unable to update special campaign", error);
    return noStoreJson({ error: "The special campaign could not be updated." }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env, "id"> = async ({ env, params }) => {
  try {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return noStoreJson({ error: "Campaign ID is required." }, { status: 400 });
    const deleted = await deleteSpecialCampaign(env.DB, id);
    if (!deleted) return noStoreJson({ error: "Campaign not found." }, { status: 404 });
    return noStoreJson({ deleted: true });
  } catch (error) {
    console.error("Unable to delete special campaign", error);
    return noStoreJson({ error: "The special campaign could not be deleted." }, { status: 500 });
  }
};

