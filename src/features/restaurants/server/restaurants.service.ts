import { aiAdapter } from "@/server/ai/adapter";
import type { RestaurantSearchRequest } from "@/server/ai/types";

export async function searchRestaurants(req: RestaurantSearchRequest) {
  return aiAdapter.searchRestaurants(req);
}
