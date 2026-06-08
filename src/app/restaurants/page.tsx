import { AppShell } from "@/shared/layout/app-shell";
import { RestaurantList } from "@/features/restaurants/components/restaurant-list";

export default function RestaurantsPage() {
  return (
    <AppShell title="맛집 추천">
      <RestaurantList />
    </AppShell>
  );
}
