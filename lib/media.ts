import { Division } from "@/lib/types";

// Site photography in /public/images, copied from gazellekey-web.
// Used for listings that have no photo of their own.

export const DIVISION_IMAGES: Record<Division, string> = {
  TRAVEL: "/images/travel-maldives.jpg",
  EVENTS: "/images/events-festival.jpg",
  GEMS: "/images/gems-pink-sapphire.jpg",
  VEHICLES: "/images/vehicles-car.jpg",
  IMPORT: "/images/import-containers.jpg",
  EXPORT: "/images/export-ship.jpg",
};

// Photos for catalogue categories (trade categories / listing types)
const CATEGORY_IMAGES: Record<string, string> = {
  TEA: "/images/export-tea.jpg",
  SPICES: "/images/export-spices.jpg",
  COFFEE: "/images/export-coffee.jpg",
  CHOCOLATE: "/images/export-chocolate.jpg",
  FRUITS_VEGETABLES: "/images/export-fruits.jpg",
  ELECTRICAL_ITEMS: "/images/import-electronics.jpg",
  COMPUTERS_HARDWARE_PHONES: "/images/import-electronics.jpg",
  HEAVY_MACHINERY: "/images/vehicles-excavator.jpg",
  CONFERENCE: "/images/events-conference.jpg",
  TRADE_SHOW: "/images/events-conference.jpg",
  WORKSHOP: "/images/events-conference.jpg",
  JEWELLERY: "/images/gems-coloured-rings.jpg",
  GEMSTONE: "/images/gems-diamonds.jpg",
};

export function fallbackImage(division: Division, category?: string | null) {
  return (category ? CATEGORY_IMAGES[category] : undefined) ?? DIVISION_IMAGES[division];
}
