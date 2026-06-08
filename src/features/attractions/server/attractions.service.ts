import { aiAdapter } from "@/server/ai/adapter";
import type { JapanRegionId } from "@/shared/lib/constants";

export async function listAttractions(region: JapanRegionId) {
  return aiAdapter.getAttractions(region);
}
