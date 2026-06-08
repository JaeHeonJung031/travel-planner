import { aiAdapter } from "@/server/ai/adapter";
import type { AccommodationSearchRequest } from "@/server/ai/types";

export async function searchStays(req: AccommodationSearchRequest) {
  return aiAdapter.searchAccommodations(req);
}
