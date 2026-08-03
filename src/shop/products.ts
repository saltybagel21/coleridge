// Public catalogue sourced from Final Pricelist Wholesale.pdf (August 2026).
// Only the final customer-facing price from the document is used.

export type Unit = "kg" | "each";
export type OrderType = "retail" | "wholesale";
export type StockStatus = "in_stock" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  priceLabel?: string;
  unit: Unit;
  note?: string;
  minQty?: number;
  qtyStep?: number;
  maxQty?: number;
  stockStatus?: StockStatus;
  enabled?: boolean;
  sortOrder?: number;
  image?: string;
}

const available = (product: Omit<Product, "stockStatus" | "enabled">): Product => ({
  ...product,
  stockStatus: "in_stock",
  enabled: true,
});

export const PUBLIC_PRODUCTS: Product[] = [
  // Chicken
  available({ id: "chicken-fillet", name: "Chicken Fillet", category: "Chicken", price: 68.99, unit: "kg", note: "Fresh, packed in 5kg bags; trays available for resale", minQty: 5, qtyStep: 5 }),
  available({ id: "chicken-wings", name: "Chicken Wings", category: "Chicken", price: 73.59, unit: "kg", note: "Individually frozen in 5kg bags; fresh available upon request", minQty: 5, qtyStep: 5 }),
  available({ id: "chicken-leg-quarters", name: "Chicken Leg Quarters", category: "Chicken", price: 52.89, unit: "kg", note: "Individually frozen in 5kg bags; fresh available upon request", minQty: 5, qtyStep: 5 }),
  available({ id: "chicken-thighs", name: "Chicken Thighs", category: "Chicken", price: 59.79, unit: "kg", note: "Individually frozen in 5kg bags; fresh available upon request", minQty: 5, qtyStep: 5 }),
  available({ id: "chicken-drumsticks", name: "Chicken Drumsticks", category: "Chicken", price: 74.74, unit: "kg", note: "Individually frozen in 5kg bags; fresh available upon request", minQty: 5, qtyStep: 5 }),
  available({ id: "chicken-whole-birds", name: "Chicken Whole Birds", category: "Chicken", price: 51.74, unit: "kg", note: "Fresh, 10 units per box; specific sizes available on order", minQty: 1, qtyStep: 1 }),
  available({ id: "tumbled-chicken-fillet", name: "Tumbled Chicken Fillet", category: "Chicken", price: 57.49, unit: "kg", note: "Frozen in 5kg bags; recommended for moist chicken fillet burgers", minQty: 5, qtyStep: 5 }),
  available({ id: "chicken-lq-medium", name: "Chicken LQ Medium 240g-275g", category: "Chicken", price: 16.09, unit: "each", note: "Individually frozen; 20 units per bag" }),
  available({ id: "chicken-lq-large", name: "Chicken LQ Large 280g-305g", category: "Chicken", price: 17.24, unit: "each", note: "Individually frozen; 20 units per bag" }),
  available({ id: "chicken-lq-xlarge", name: "Chicken LQ X Large 310g-340g", category: "Chicken", price: 18.39, unit: "each", note: "Individually frozen; 20 units per bag" }),
  available({ id: "chicken-fillet-strips", name: "Chicken Fillet Strips", category: "Chicken", price: 74.74, unit: "kg", note: "Packed to your requirements; always made to order" }),
  available({ id: "chicken-fillet-goulash", name: "Chicken Fillet Goulash", category: "Chicken", price: 74.74, unit: "kg", note: "Packed to your requirements; always made to order" }),
  available({ id: "chicken-fillet-pizza-pieces", name: "Chicken Fillet Pizza Pieces", category: "Chicken", price: 74.74, unit: "kg", note: "Packed in 1kg bags; always made to order", minQty: 1, qtyStep: 1 }),

  // Beef fresh vacuum-packed primals
  available({ id: "beef-brisket", name: "Brisket", category: "Beef Primals", price: 149.49, unit: "kg", note: "Fresh and vacuum packed" }),
  available({ id: "beef-sirloin", name: "Sirloin", category: "Beef Primals", price: 149.49, unit: "kg", note: "Fresh and vacuum packed" }),
  available({ id: "beef-rump-a", name: "Rump A", category: "Beef Primals", price: 149.49, unit: "kg", note: "Fresh and vacuum packed; available on order" }),
  available({ id: "beef-soft-shin", name: "Soft Shin", category: "Beef Primals", price: 109.24, unit: "kg", note: "Fresh and vacuum packed" }),
  available({ id: "beef-knuckle", name: "Knuckle", category: "Beef Primals", price: 120.00, unit: "kg", note: "Fresh and vacuum packed; available on order" }),
  available({ id: "beef-silverside-a", name: "Silverside A", category: "Beef Primals", price: 120.00, unit: "kg", note: "Fresh and vacuum packed" }),
  available({ id: "beef-topside-a", name: "Topside A", category: "Beef Primals", price: 120.00, unit: "kg", note: "Fresh and vacuum packed" }),

  // Prepared beef
  available({ id: "sirloin-steak-portioned", name: "Sirloin Steak Portioned", category: "Prepared Beef", price: 172.49, unit: "kg", note: "Individually cut and vacuum packed; specific portion sizes available" }),
  available({ id: "tenderized-steak", name: "Tenderized Steak", category: "Prepared Beef", price: 129.94, unit: "kg", note: "Prepared from cleaned beef" }),
  available({ id: "beef-goulash", name: "Beef Goulash", category: "Prepared Beef", price: 129.94, unit: "kg", note: "Prepared from cleaned beef" }),
  available({ id: "beef-strips", name: "Beef Strips", category: "Prepared Beef", price: 129.94, unit: "kg", note: "Prepared from cleaned beef" }),
  available({ id: "boneless-shin-stew", name: "Boneless Shin Stew", category: "Prepared Beef", price: 129.94, unit: "kg", note: "Lean, boneless beef for stew" }),
  available({ id: "boneless-neck-stew", name: "Boneless Neck Stew", category: "Prepared Beef", price: 114.99, unit: "kg", note: "Boneless beef stew with some fat" }),

  // Lamb and mutton
  available({ id: "lamb-a0", name: "Lamb A0", category: "Lamb & Mutton", price: 139.99, unit: "kg", note: "Lean whole lamb, cut to your requirements" }),
  available({ id: "lamb-roast-cuts", name: "Lamb Roast Cuts", category: "Lamb & Mutton", price: 149.49, unit: "kg", note: "Shoulder, loin, leg and shanks" }),
  available({ id: "lamb-a2-ribs-riblets", name: "Lamb A2 Ribs & Riblets", category: "Lamb & Mutton", price: 114.99, unit: "kg", note: "Ribs and riblets for roasting or the braai" }),
  available({ id: "lamb-stew", name: "Lamb Stew", category: "Lamb & Mutton", price: 149.49, unit: "kg", note: "Lean lamb stew made with ribs, shanks and shoulder" }),
  available({ id: "lamb-leg", name: "Lamb Leg", category: "Lamb & Mutton", price: 0, priceLabel: "Ask for price", unit: "kg", note: "Available with or without fat; ask for availability" }),
  available({ id: "lamb-braai-chops", name: "Lamb Braai Chops", category: "Lamb & Mutton", price: 149.49, unit: "kg", note: "Lean lamb chops prepared for the braai" }),

  // Ostrich
  available({ id: "ostrich-steak", name: "Ostrich Steak", category: "Ostrich", price: 114.99, unit: "kg", note: "Individually cut and vacuum packed; specific portion sizes available" }),
  available({ id: "ostrich-goulash", name: "Ostrich Goulash", category: "Ostrich", price: 126.49, unit: "kg", note: "Prepared from cleaned ostrich" }),
  available({ id: "ostrich-strips", name: "Ostrich Strips", category: "Ostrich", price: 126.49, unit: "kg", note: "Prepared from cleaned ostrich" }),

  // Mince
  available({ id: "beef-steak-mince-80-20", name: "Beef Steak Mince 80/20", category: "Mince", price: 91.99, unit: "kg", note: "Made fresh to order and vacuum packed" }),
  available({ id: "beef-lean-steak-mince-90-10", name: "Beef Lean Steak Mince 90/10", category: "Mince", price: 103.49, unit: "kg", note: "Made fresh to order and vacuum packed" }),
  available({ id: "beef-ultra-lean-steak-mince-95-5", name: "Beef Ultra Lean Steak Mince 95/5", category: "Mince", price: 120.74, unit: "kg", note: "Made fresh to order and vacuum packed" }),

  // Boerewors and sausages
  available({ id: "oupas-boerewors", name: "Oupa's Boerewors", category: "Boerewors & Sausages", price: 86.24, unit: "kg", note: "Traditional boerewors with great flavour" }),
  available({ id: "oumas-boerewors", name: "Ouma's Boerewors", category: "Boerewors & Sausages", price: 86.24, unit: "kg", note: "Traditional boerewors with great flavour" }),
  available({ id: "breakfast-wors", name: "Breakfast Wors", category: "Boerewors & Sausages", price: 10.01, unit: "each", note: "15cm portion, approximately 80g-100g" }),
  available({ id: "hotdog-wors", name: "Hotdog Wors", category: "Boerewors & Sausages", price: 10.99, unit: "each", note: "15cm portion, approximately 100g-120g" }),
  available({ id: "footlong-wors", name: "Footlong Wors", category: "Boerewors & Sausages", price: 13.79, unit: "each", note: "22cm portion, approximately 130g-150g" }),
  available({ id: "nyama-supreme-wors", name: "Nyama Supreme Wors", category: "Boerewors & Sausages", price: 57.49, unit: "kg", note: "Made on order; trays available for resale" }),

  // Patties and meatballs
  available({ id: "oupa-beef-patty-120g", name: "Oupa se Beef Patty 120g 100mm", category: "Patties & Meatballs", price: 9.99, unit: "each", note: "Standard burger size" }),
  available({ id: "oupa-beef-patty-150g", name: "Oupa se Beef Patty 150g 130mm", category: "Patties & Meatballs", price: 13.49, unit: "each", note: "Larger burger size" }),
  available({ id: "meatball-40g", name: "Meatball 40g", category: "Patties & Meatballs", price: 4.01, unit: "each", note: "House-made beef meatball" }),
  available({ id: "beef-bbq-cheese-patty-120g", name: "Beef BBQ Cheese Patty 120g 100mm", category: "Patties & Meatballs", price: 11.99, unit: "each", note: "House-made cheesy beef patty" }),
  available({ id: "chicken-patty-120g", name: "Chicken Patty 120g 100mm", category: "Patties & Meatballs", price: 7.50, unit: "each", note: "Made with chicken fillet and a light lemon flavour" }),
  available({ id: "six-gun-beef-patty-120g", name: "6 Gun Beef Patty 120g 100mm", category: "Patties & Meatballs", price: 21.84, unit: "each", note: "Well-known flavour; made on order" }),
  available({ id: "wagyu-beef-patty-150g", name: "Beef Wagyu Patty 150g 130mm", category: "Patties & Meatballs", price: 30.00, unit: "each", note: "Rich and creamy Wagyu flavour" }),

  // Marinated products
  available({ id: "bbq-buffalo-wings-850g", name: "BBQ Buffalo Wings 850g", category: "Marinated Products", price: 68.99, unit: "each", note: "Ready for the pan or braai" }),
  available({ id: "peri-buffalo-wings-850g", name: "Peri Buffalo Wings 850g", category: "Marinated Products", price: 68.99, unit: "each", note: "Ready for the pan or braai" }),
  available({ id: "sweet-chilli-buffalo-wings-850g", name: "Sweet Chilli Buffalo Wings 850g", category: "Marinated Products", price: 68.99, unit: "each", note: "Ready for the pan or braai" }),
  available({ id: "lemon-herb-buffalo-wings-850g", name: "Lemon & Herb Buffalo Wings 850g", category: "Marinated Products", price: 68.99, unit: "each", note: "Ready for the pan or braai" }),

  // Kebabs and sosaties
  available({ id: "steak-kebab-60g", name: "Steak Kebab 60g Cocktail", category: "Kebabs & Sosaties", price: 13.79, unit: "each", note: "Made on order; ideal for platters" }),
  available({ id: "steak-kebab-100g", name: "Steak Kebab 100g", category: "Kebabs & Sosaties", price: 18.39, unit: "each", note: "Made on order; ideal for platters" }),
  available({ id: "steak-kebab-150g", name: "Steak Kebab 150g", category: "Kebabs & Sosaties", price: 26.44, unit: "each", note: "Made on order; ideal for the braai" }),
  available({ id: "steak-kebab-200g", name: "Steak Kebab 200g Espetada", category: "Kebabs & Sosaties", price: 34.49, unit: "each", note: "Made on order; ideal for the braai" }),
  available({ id: "chicken-kebab-60g", name: "Chicken Fillet Kebab 60g Cocktail", category: "Kebabs & Sosaties", price: 10.34, unit: "each", note: "Made on order; ideal for platters" }),
  available({ id: "chicken-kebab-100g", name: "Chicken Fillet Kebab 100g", category: "Kebabs & Sosaties", price: 14.94, unit: "each", note: "Made on order; ideal for platters" }),
  available({ id: "chicken-kebab-150g", name: "Chicken Fillet Kebab 150g", category: "Kebabs & Sosaties", price: 21.84, unit: "each", note: "Made on order; ideal for the braai" }),
  available({ id: "chicken-kebab-200g", name: "Chicken Fillet Kebab 200g Espetada", category: "Kebabs & Sosaties", price: 27.59, unit: "each", note: "Made on order; ideal for the braai" }),

  // Eggs and chips
  available({ id: "eggs-large-loose-box", name: "Eggs Large Loose Box 12 x 30", category: "Eggs & Chips", price: 799.00, unit: "each", note: "For kitchens and bakeries" }),
  available({ id: "eggs-large-half-dozen-box", name: "Eggs Large Half Dozen Box 6 x 30", category: "Eggs & Chips", price: 550.00, unit: "each", note: "Packed for resale" }),
  available({ id: "mcain-chips-7mm", name: "McCain Chips 7mm", category: "Eggs & Chips", price: 35.99, unit: "each", note: "Skinny frozen fries" }),
  available({ id: "frozen-valley-chips-10mm", name: "Frozen Valley Chips 10mm", category: "Eggs & Chips", price: 27.99, unit: "each", note: "Thick-cut frozen fries" }),
  available({ id: "frozen-valley-chips-12mm", name: "Frozen Valley Chips 12mm", category: "Eggs & Chips", price: 27.99, unit: "each", note: "Extra-thick frozen fries" }),
  available({ id: "rustic-frozen-valley-chips", name: "Rustic Frozen Valley Chips 10mm x 20mm", category: "Eggs & Chips", price: 43.69, unit: "each", note: "Thick and wide rustic frozen chips" }),

  // Frozen vegetables
  available({ id: "mix-veg-10x1kg", name: "Mix Veg (10 x 1kg)", category: "Frozen Vegetables", price: 29.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "corn-10x1kg", name: "Corn (10 x 1kg)", category: "Frozen Vegetables", price: 34.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "green-beans-10x1kg", name: "Green Beans (10 x 1kg)", category: "Frozen Vegetables", price: 34.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "broccoli-10x1kg", name: "Broccoli (10 x 1kg)", category: "Frozen Vegetables", price: 34.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "diced-carrot-10x1kg", name: "Diced Carrot (10 x 1kg)", category: "Frozen Vegetables", price: 29.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "cauliflower-10x1kg", name: "Cauliflower (10 x 1kg)", category: "Frozen Vegetables", price: 34.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "hawai-mix-10x1kg", name: "Hawai Mix (10 x 1kg)", category: "Frozen Vegetables", price: 34.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "carrot-round-cut-10x1kg", name: "Carrot Round Cut (10 x 1kg)", category: "Frozen Vegetables", price: 29.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "sweet-potato-chunks-10x1kg", name: "Sweet Potato Chunks (10 x 1kg)", category: "Frozen Vegetables", price: 31.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "country-crop-10x1kg", name: "Country Crop (10 x 1kg)", category: "Frozen Vegetables", price: 34.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "peas-10x1kg", name: "Peas (10 x 1kg)", category: "Frozen Vegetables", price: 34.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "cut-green-beans-6x1kg", name: "Cut Green Beans (6 x 1kg)", category: "Frozen Vegetables", price: 39.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "broccoli-florets-6x1kg", name: "Broccoli Florets (6 x 1kg)", category: "Frozen Vegetables", price: 39.99, unit: "each", note: "Frozen vegetables; available on order" }),
  available({ id: "mushroom-pieces-stems-10x1kg", name: "Mushroom Pieces & Stems (10 x 1kg)", category: "Frozen Vegetables", price: 37.99, unit: "each", note: "Frozen vegetables; available on order" }),
].map((product, index) => ({ ...product, sortOrder: index + 1 }));

export const PUBLIC_CATEGORY_ORDER = [
  "Chicken",
  "Beef Primals",
  "Prepared Beef",
  "Lamb & Mutton",
  "Ostrich",
  "Mince",
  "Boerewors & Sausages",
  "Patties & Meatballs",
  "Marinated Products",
  "Kebabs & Sosaties",
  "Eggs & Chips",
  "Frozen Vegetables",
];

// Compatibility aliases for the preserved two-counter components. The live site
// always uses PUBLIC_PRODUCTS; the exact former lists are in /legacy.
export const RETAIL_PRODUCTS = PUBLIC_PRODUCTS;
export const WHOLESALE_PRODUCTS = PUBLIC_PRODUCTS;
export const CATEGORY_ORDER: Record<OrderType, string[]> = {
  retail: PUBLIC_CATEGORY_ORDER,
  wholesale: PUBLIC_CATEGORY_ORDER,
};
