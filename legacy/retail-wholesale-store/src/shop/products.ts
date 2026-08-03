// Product catalogue sourced from Coleridge Meat Retail + Wholesale price lists (April 2026).
// Prices are in ZAR, incl. VAT unless noted. Units: "kg" (per kilogram) or "each" (per unit).

export type PriceUnit = "kg" | "each";
export type OrderType = "retail" | "wholesale";
export type StockStatus = "in_stock" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;      // ZAR incl. VAT (0 = price on request / N/S)
  priceLabel?: string; // overrides formatted price display (e.g. "N/S")
  stockStatus?: StockStatus;
  enabled?: boolean;
  unit: PriceUnit;
  note?: string;      // packing / availability / recommendation
  image?: string;
  // Ordering constraints derived from price list packing rules:
  minQty?: number;    // minimum quantity (kg or units). Default: 0.5 for kg, 1 for each
  maxQty?: number;    // maximum quantity (kg), e.g. for whole cuts with a weight range
  qtyStep?: number;   // stepper increment. Default: 0.5 for kg, 1 for each
}

const PRODUCT_PHOTOS: Record<string, string> = {
  "r-chk-fillet": "/images/products/chicken-fillet.webp",
  "r-chk-fillet-pc": "/images/products/chicken-fillet-pieces.webp",
  "r-chk-wings": "/images/products/chicken-wings.webp",
  "r-chk-buff": "/images/products/chicken-wings.webp",
  "r-chk-buff-mar": "/images/products/chicken-wings.webp",
  "r-beef-sir-whole": "/images/products/sirloin-steak.webp",
  "r-beef-sir-cut": "/images/products/sirloin-steak.webp",
  "r-beef-rump": "/images/products/rump-tail-steak.webp",
  "r-beef-mince-80": "/images/products/beef-mince-80-20.webp",
  "r-beef-mince-90": "/images/products/beef-mince-90-10.webp",
  "r-beef-tender": "/images/products/beef-tenderized-steak.webp",
  "r-ost-goulash": "/images/products/ostrich-goulash.webp",
  "r-ost-steaks": "/images/products/ostrich-steak.webp",
  "r-prep-ost-port": "/images/products/ostrich-steak.webp",
  "r-prep-beef-kb60": "/images/products/beef-kebab.webp",
  "r-prep-beef-kb100": "/images/products/beef-kebab.webp",
  "r-prep-beef-kb200": "/images/products/beef-kebab.webp",
  "r-prep-chk-kb60": "/images/products/beef-kebab.webp",
  "r-prep-chk-kb100": "/images/products/beef-kebab.webp",
  "r-prep-chk-kb200": "/images/products/beef-kebab.webp",
  "r-prep-chk-med": "/images/products/chicken-fillet.webp",
  "r-prep-chk-lrg": "/images/products/chicken-fillet.webp",
  "r-ch-mozloaf": "/images/products/mozzarella-cheese-block.webp",
  "r-ch-mozgr": "/images/products/shredded-cheese-mix.webp",
  "r-ch-chedgr": "/images/products/shredded-cheddar.webp",
  "r-ch-chedloaf": "/images/products/cheddar-cheese-block.webp",
  "r-ch-gouda": "/images/products/gouda-cheese-block.webp",
  "r-ch-pizza": "/images/products/shredded-cheese-mix.webp",

  "w-chk-fillet": "/images/products/chicken-fillet.webp",
  "w-chk-fillet-pizza": "/images/products/chicken-fillet-pieces.webp",
  "w-chk-wings": "/images/products/chicken-wings.webp",
  "w-chk-buff": "/images/products/chicken-wings.webp",
  "w-chk-buff-lh": "/images/products/chicken-wings.webp",
  "w-chk-buff-bbq": "/images/products/chicken-wings.webp",
  "w-chk-buff-peri": "/images/products/chicken-wings.webp",
  "w-chk-buff-sc": "/images/products/chicken-wings.webp",
  "w-beef-striploin-karan": "/images/products/sirloin-steak.webp",
  "w-beef-rump-a-karan": "/images/products/rump-tail-steak.webp",
  "w-beef-rump-tail": "/images/products/rump-tail-steak.webp",
  "w-beef-rump-c": "/images/products/rump-tail-steak.webp",
  "w-beef-fillet": "/images/products/sirloin-steak.webp",
  "w-beef-tender": "/images/products/beef-tenderized-steak.webp",
  "w-beef-karan-cut": "/images/products/sirloin-steak.webp",
  "w-mince-80": "/images/products/beef-mince-80-20.webp",
  "w-mince-90": "/images/products/beef-mince-90-10.webp",
  "w-ost-trim": "/images/products/ostrich-goulash.webp",
  "w-ost-steaks": "/images/products/ostrich-steak.webp",
  "w-prep-ost-port": "/images/products/ostrich-steak.webp",
  "w-ch-mozloaf-mini": "/images/products/mozzarella-cheese-block.webp",
  "w-ch-mozgr": "/images/products/shredded-cheese-mix.webp",
  "w-ch-chedloaf-mini": "/images/products/cheddar-cheese-block.webp",
  "w-ch-chedgr": "/images/products/shredded-cheddar.webp",
  "w-ch-gouda-mini": "/images/products/gouda-cheese-block.webp",
  "w-ch-pizza": "/images/products/shredded-cheese-mix.webp",
  "w-prep-beef-kb60": "/images/products/beef-kebab.webp",
  "w-prep-beef-kb100": "/images/products/beef-kebab.webp",
  "w-prep-beef-kb150": "/images/products/beef-kebab.webp",
  "w-prep-beef-kb200": "/images/products/beef-kebab.webp",
  "w-prep-chk-kb60": "/images/products/beef-kebab.webp",
  "w-prep-chk-kb100": "/images/products/beef-kebab.webp",
  "w-prep-chk-kb150": "/images/products/beef-kebab.webp",
  "w-prep-chk-kb200": "/images/products/beef-kebab.webp",
  "w-prep-chk-med": "/images/products/chicken-fillet.webp",
  "w-prep-chk-lrg": "/images/products/chicken-fillet.webp",
};

const withProductPhotos = (products: Product[]): Product[] =>
  products.map((product) => ({
    ...product,
    ...(PRODUCT_PHOTOS[product.id] ? { image: PRODUCT_PHOTOS[product.id] } : {}),
  }));

// ---------------------------------------------------------------------------
// RETAIL
// ---------------------------------------------------------------------------
export const RETAIL_PRODUCTS: Product[] = withProductPhotos([
  // Chicken
  { id: "r-chk-fillet",       name: "Chicken Fillet",                        category: "Chicken",       price: 74.99,  unit: "kg",   note: "Fresh 5kg bag; in stock; lean fillet for whatever you need", minQty: 5, qtyStep: 5 },
  { id: "r-chk-wings",        name: "Chicken Wings",                         category: "Chicken",       price: 79.99,  unit: "kg",   note: "Individually frozen in 5kg bags, not injected; in stock; great for platters or parties", minQty: 5, qtyStep: 5 },
  { id: "r-chk-thighs",       name: "Chicken Thighs",                        category: "Chicken",       price: 59.99,  unit: "kg",   note: "Individually frozen in 5kg bags, not injected; in stock; great for roasting chicken", minQty: 5, qtyStep: 5 },
  { id: "r-chk-drums",        name: "Chicken Drumsticks",                    category: "Chicken",       price: 74.99,  unit: "kg",   note: "Individually frozen in 5kg bags, not injected; in stock; great for roasting chicken", minQty: 5, qtyStep: 5 },
  { id: "r-chk-whole",        name: "Chicken Whole (Grilliers)",             category: "Chicken",       price: 54.99,  unit: "kg",   note: "Fresh, 10 units in a box; specific size can be requested; on order", minQty: 1, qtyStep: 1 },
  { id: "r-chk-stew",         name: "Chicken Stew",                          category: "Chicken",       price: 59.99,  unit: "kg",   note: "Chicken fillet and thighs; made on order; great for stew" },
  { id: "r-chk-fillet-pc",    name: "Chicken Fillet Pizza Pieces",           category: "Chicken",       price: 84.99,  unit: "kg",   note: "1kg bags, cut smaller than 1cm; made on order; perfect topping for pizzas", minQty: 1, qtyStep: 1 },
  { id: "r-chk-buff",         name: "Chicken Buffalo Wings",                 category: "Chicken",       price: 74.99,  unit: "kg",   note: "Any quantity; made on order; great for platters or parties" },
  { id: "r-chk-buff-lh",      name: "Chicken Buffalo Wings L&H",             category: "Chicken",       price: 74.99,  unit: "kg",   note: "Marinated lemon and herb buffalo wings; in stock" },
  { id: "r-chk-buff-bbq",     name: "Chicken Buffalo Wings BBQ",             category: "Chicken",       price: 74.99,  unit: "kg",   note: "Marinated tangy BBQ buffalo wings; in stock" },
  { id: "r-chk-buff-peri",    name: "Chicken Buffalo Wings Peri",            category: "Chicken",       price: 74.99,  unit: "kg",   note: "Marinated peri peri buffalo wings; in stock" },
  { id: "r-chk-buff-sc",      name: "Chicken Buffalo Wings S/C",             category: "Chicken",       price: 74.99,  unit: "kg",   note: "Marinated sweet chilli buffalo wings; in stock" },

  // Beef
  { id: "r-beef-striploin",   name: "Striploin (Karan)",                     category: "Beef",          price: 179.99, unit: "kg",   note: "Fresh box; in stock; cut your own steaks" },
  { id: "r-beef-topside",     name: "Topside A",                             category: "Beef",          price: 159.99, unit: "kg",   note: "Fresh box; in stock; biltong or tenderize steak" },
  { id: "r-beef-knuckle",     name: "Knuckle A",                             category: "Beef",          price: 139.99, unit: "kg",   note: "Fresh box; in stock; goulash, strips, mince or wors" },
  { id: "r-beef-crops",       name: "Crops (Karan)",                         category: "Beef",          price: 105.99, unit: "kg",   note: "Fresh box; made on order; cooked as a steak or great for kebabs" },
  { id: "r-beef-rump-a",      name: "Rump A (Karan)",                        category: "Beef",          price: 105.99, unit: "kg",   note: "Fresh box; on order; cut your own steaks" },
  { id: "r-beef-rump-tail",   name: "Rump Tail",                             category: "Beef",          price: 105.99, unit: "kg",   note: "Fresh box; in stock; cut your own steaks or use for kebabs" },
  { id: "r-beef-silverside",  name: "Silverside A",                          category: "Beef",          price: 105.99, unit: "kg",   note: "Fresh box; in stock; biltong or tenderize steak" },
  { id: "r-beef-rump-c",      name: "Rump C0/1",                             category: "Beef",          price: 109.99, unit: "kg",   note: "Fresh box; in stock; all rounder" },
  { id: "r-beef-fillet",      name: "Fillet",                                category: "Beef",          price: 289.99, unit: "kg",   note: "Fresh box; on order; lean steak" },
  { id: "r-beef-soft-shin",   name: "Soft Shin",                             category: "Beef",          price: 104.99, unit: "kg",   note: "Fresh box; in stock; best for stew mixed with more boney meat" },
  { id: "r-beef-bolo",        name: "Bolo 0/1",                              category: "Beef",          price: 104.99, unit: "kg",   note: "Fresh box; in stock; all rounder" },
  { id: "r-beef-body-fat",    name: "Body Fat",                              category: "Beef",          price: 39.99,  unit: "kg",   note: "Frozen box; in stock; high quality fat" },
  { id: "r-beef-marrow",      name: "Marrow Bones",                          category: "Beef",          price: 29.99,  unit: "kg",   note: "Frozen box; on order; soup or toast" },
  { id: "r-beef-tender",      name: "Beef Tenderize Steak",                  category: "Beef",          price: 139.99, unit: "kg",   note: "Any quantity; made on order; nice and lean, good for a lot" },
  { id: "r-beef-sir-port",    name: "(Karan) Beef Sirloin Portioned",        category: "Beef",          price: 0,      priceLabel: "N/S", unit: "kg", note: "Size requested; made on order; cut and vacuum packed individually" },
  { id: "r-beef-goulash",     name: "Beef Goulash / Strips",                 category: "Beef",          price: 129.99, unit: "kg",   note: "Any quantity; made on order; stews, pies and stroganoff" },
  { id: "r-beef-boneless-stew", name: "Beef Boneless Stew",                  category: "Beef",          price: 99.99,  unit: "kg",   note: "Any quantity; in stock; nice stew and budget friendly" },
  { id: "r-beef-stew-bone",   name: "Beef Stew (With Bone)",                 category: "Beef",          price: 74.90,  unit: "kg",   note: "Any quantity; in stock; meaty stew with great beef flavour" },
  { id: "r-beef-wors",        name: "Boerewors",                             category: "Beef",          price: 94.99,  unit: "kg",   note: "Fresh or frozen, packed in trays 400g-1kg; in stock; burgers, sausage, meatballs or kebabs", minQty: 0.4, qtyStep: 0.1 },

  // Minces
  { id: "r-beef-mince-80",    name: "Beef Steak Mince 80/20",                category: "Minces",        price: 94.99,  unit: "kg",   note: "Fresh vacuumed 5kg bags; made on order; great for smash burgers or lasagne", minQty: 5, qtyStep: 5 },
  { id: "r-beef-mince-90",    name: "Beef Lean Steak Mince 90/10",           category: "Minces",        price: 105.99, unit: "kg",   note: "Fresh vacuumed 5kg bags; made on order; great for a filling or lasagne", minQty: 5, qtyStep: 5 },
  { id: "r-beef-mince-95",    name: "Beef Ultra Lean Steak Mince 95/5",      category: "Minces",        price: 129.99, unit: "kg",   note: "Any quantity; made on order; when you need that extra lean mince" },

  // Ostrich
  { id: "r-ost-trim",         name: "Ostrich Trim",                          category: "Ostrich",       price: 99.99,  unit: "kg",   note: "Frozen box; ask for availability; lean trim for goulash or strips" },
  { id: "r-ost-steaks",       name: "Ostrich Steak",                         category: "Ostrich",       price: 109.99, unit: "kg",   note: "Fresh or frozen 2.5kg bags; ask for availability; nice lean no-fat steaks", minQty: 2.5, qtyStep: 2.5 },
  { id: "r-ost-hearts",       name: "Ostrich Hearts",                        category: "Ostrich",       price: 39.99,  unit: "kg",   note: "Frozen 10kg average bags; ask for availability; good substitute for beef hearts" },

  // Lamb
  { id: "r-lamb-stew",        name: "Lamb Stew",                             category: "Lamb",          price: 144.99, unit: "kg",   note: "Fresh or frozen; please arrange for best shelf life; on order; lean lamb stew" },
  { id: "r-lamb-riblets",     name: "Lamb A1/2 Riblets",                     category: "Lamb",          price: 159.99, unit: "kg",   note: "Fresh or frozen; please arrange for best shelf life; on order; best riblets to braai and baste" },
  { id: "r-lamb-ribs",        name: "Lamb A1/2 Ribs",                        category: "Lamb",          price: 139.99, unit: "kg",   note: "Fresh or frozen; please arrange for best shelf life; on order; best ribs to braai and baste" },
  { id: "r-lamb-a0-braai",    name: "Lamb A0 Braaichops",                    category: "Lamb",          price: 129.99, unit: "kg",   note: "Fresh or frozen; please arrange for best shelf life; on order; lean braai chops" },
  { id: "r-lamb-a0-loin",     name: "Lamb A0 Loin Chops",                    category: "Lamb",          price: 129.99, unit: "kg",   note: "Fresh or frozen; please arrange for best shelf life; on order; lean loin chops" },
  { id: "r-lamb-kidneys",     name: "Lamb Kidneys",                          category: "Lamb",          price: 34.99,  unit: "kg",   note: "Frozen; can be packed in trays or bags; on order" },
  { id: "r-lamb-kidneys-cut", name: "Lamb Kidneys Cut",                      category: "Lamb",          price: 49.99,  unit: "kg",   note: "Frozen 5kg bag; in stock; cut for pie production", minQty: 5, qtyStep: 5 },

  // Fish
  { id: "r-fish-hake",        name: "Hake Steaks",                           category: "Fish",          price: 154.99, unit: "kg",   note: "100g-330g individually wrapped; made on order; great for battered fish or nice size pieces to cook" },
  { id: "r-fish-finger-tray", name: "Fish Finger Tray",                      category: "Fish",          price: 23.00,  unit: "each", note: "10 fish fingers per tray; made on order; for the kids" },
  { id: "r-fish-cakes-tray",  name: "Fish Cakes Tray",                       category: "Fish",          price: 19.99,  unit: "each", note: "5 fish cakes per tray; made on order; for the kids" },

  // Ready to Cook
  { id: "r-prep-ost-port",    name: "Ostrich Steak Portioned",               category: "Ready to Cook", price: 39.99,  unit: "each", note: "Fresh vacuumed, 270g-300g; on order; lean steak" },
  { id: "r-prep-wagyu",       name: "Beef Wagyu Burgers",                    category: "Ready to Cook", price: 30.00,  unit: "each", note: "Fresh or frozen 150g, 130mm; in stock" },
  { id: "r-prep-wors-bf",     name: "Boerewors Breakfast",                   category: "Ready to Cook", price: 10.99,  unit: "each", note: "Fresh or frozen 80g-100g / 15cm; in stock" },
  { id: "r-prep-wors-hd",     name: "Boerewors Hotdog",                      category: "Ready to Cook", price: 11.99,  unit: "each", note: "Fresh or frozen 100g-120g / 15cm; in stock" },
  { id: "r-prep-wors-ft",     name: "Boerewors Footlong",                    category: "Ready to Cook", price: 13.99,  unit: "each", note: "Fresh or frozen 130g-150g / 22cm; in stock" },
  { id: "r-prep-beef-mball",  name: "Beef Meatballs 40G",                    category: "Ready to Cook", price: 3.99,   unit: "each", note: "Fresh or frozen 40g; in stock" },
  { id: "r-prep-beef-patty-s",name: "Beef Patties 100G",                    category: "Ready to Cook", price: 11.99,  unit: "each", note: "Fresh or frozen 100g, 100mm; in stock" },
  { id: "r-prep-beef-patty-l",name: "Beef Patties 150G",                    category: "Ready to Cook", price: 13.99,  unit: "each", note: "Fresh or frozen 150g, 130mm; in stock" },
  { id: "r-prep-bbq-patty",   name: "Beef BBQ Cheese Patties",               category: "Ready to Cook", price: 11.99,  unit: "each", note: "Fresh or frozen 100g, 100mm; in stock" },
  { id: "r-prep-jalapeno",    name: "Beef Jalapeno Patties",                 category: "Ready to Cook", price: 11.99,  unit: "each", note: "Fresh or frozen 100g, 100mm; in stock" },
  { id: "r-prep-chk-patty",   name: "Chicken Patties",                       category: "Ready to Cook", price: 7.99,   unit: "each", note: "Frozen 120g, 100mm; in stock" },
  { id: "r-prep-chk-mball",   name: "Chicken Meatballs 40G",                 category: "Ready to Cook", price: 3.99,   unit: "each", note: "Frozen 40g; made on order" },
  { id: "r-prep-beef-kb60",   name: "Rump Steak Kebab 60G",                  category: "Ready to Cook", price: 13.99,  unit: "each", note: "Rump steak with green pepper and onions; made on order" },
  { id: "r-prep-beef-kb100",  name: "Rump Steak Kebab 100G",                 category: "Ready to Cook", price: 18.99,  unit: "each", note: "Rump steak with green pepper and onions; made on order" },
  { id: "r-prep-beef-kb150",  name: "Rump Steak Kebab 150G",                 category: "Ready to Cook", price: 27.99,  unit: "each", note: "Rump steak with green pepper and onions; made on order" },
  { id: "r-prep-beef-kb200",  name: "Rump Steak Kebab 200G",                 category: "Ready to Cook", price: 39.99,  unit: "each", note: "Rump steak with green pepper and onions; made on order" },
  { id: "r-prep-chk-kb60",    name: "Chicken Fillet Kebab 60G",              category: "Ready to Cook", price: 9.99,   unit: "each", note: "Chicken fillet with green pepper and onions; made on order" },
  { id: "r-prep-chk-kb100",   name: "Chicken Fillet Kebab 100G",             category: "Ready to Cook", price: 13.90,  unit: "each", note: "Chicken fillet with green pepper and onions; made on order" },
  { id: "r-prep-chk-kb150",   name: "Chicken Fillet Kebab 150G",             category: "Ready to Cook", price: 21.99,  unit: "each", note: "Chicken fillet with green pepper and onions; made on order" },
  { id: "r-prep-chk-kb200",   name: "Chicken Fillet Kebab 200G",             category: "Ready to Cook", price: 29.99,  unit: "each", note: "Chicken fillet with green pepper and onions; made on order" },
  { id: "r-prep-chk-med",     name: "Chicken Fillet P/Medium",              category: "Ready to Cook", price: 11.99,  unit: "each", note: "Fresh or frozen 140g-160g; in stock" },
  { id: "r-prep-chk-lrg",     name: "Chicken Fillet P/Large",               category: "Ready to Cook", price: 14.99,  unit: "each", note: "Fresh or frozen 165g-205g; in stock" },
  { id: "r-prep-leg-med",     name: "Chicken Leg Q P/Medium",               category: "Ready to Cook", price: 16.99,  unit: "each", note: "Fresh or frozen 240g-275g; in stock" },
  { id: "r-prep-leg-lrg",     name: "Chicken Leg Q P/Large",                category: "Ready to Cook", price: 18.99,  unit: "each", note: "Fresh or frozen 280g-305g; in stock" },
  { id: "r-prep-leg-xl",      name: "Chicken Leg Q P/X Large",              category: "Ready to Cook", price: 19.99,  unit: "each", note: "Fresh or frozen 310g-340g; in stock" },

  // Cheese
  { id: "r-ch-mozloaf-mini",  name: "Mozzarella Loaf Mini",                  category: "Cheese",        price: 134.99, unit: "kg",   note: "Fresh 200g +/- vacuumed; in stock; for retail purposes", minQty: 0.2, qtyStep: 0.1 },
  { id: "r-ch-mozgr",         name: "Mozzarella Grated",                     category: "Cheese",        price: 110.00, unit: "kg",   note: "Frozen 2kg bags; in stock; for production purposes", minQty: 2, qtyStep: 2 },
  { id: "r-ch-chedloaf-mini", name: "Cheddar Loaf Mini",                     category: "Cheese",        price: 134.99, unit: "kg",   note: "Fresh 200g +/- vacuumed; in stock; for retail purposes", minQty: 0.2, qtyStep: 0.1 },
  { id: "r-ch-chedgr",        name: "Cheddar Grated",                        category: "Cheese",        price: 110.00, unit: "kg",   note: "Frozen 2kg bags; in stock; for production purposes", minQty: 2, qtyStep: 2 },
  { id: "r-ch-gouda-mini",    name: "Gouda Loaf Mini",                       category: "Cheese",        price: 134.99, unit: "kg",   note: "Fresh 200g +/- vacuumed; in stock; for retail purposes", minQty: 0.2, qtyStep: 0.1 },
  { id: "r-ch-pizza",         name: "Pizza Mix Grated",                      category: "Cheese",        price: 110.00, unit: "kg",   note: "Frozen 2kg bags; in stock; for production purposes", minQty: 2, qtyStep: 2 },

  // Bulk & Pantry
  { id: "r-bulk-chips-fresh", name: "Chips Fresh 7mm/10mm/12mm",             category: "Bulk & Pantry", price: 0,      priceLabel: "N/S", unit: "kg", note: "Made fresh on order; lasts 5 days in the fridge; on order; oil fry" },
  { id: "r-bulk-chips-7",     name: "Chips 7mm",                             category: "Bulk & Pantry", price: 37.99,  unit: "each", note: "Frozen 2.5kg bags x 4 in a box; in stock; oil frying, air frying or oven bake" },
  { id: "r-bulk-chips-10",    name: "Chips 10mm",                            category: "Bulk & Pantry", price: 29.99,  unit: "each", note: "Frozen 2.5kg bags x 6 in a box; on order; oil frying, air frying or oven bake" },
  { id: "r-bulk-chips-12",    name: "Chips 12mm",                            category: "Bulk & Pantry", price: 29.99,  unit: "each", note: "Frozen 2.5kg bags x 6 in a box; on order; oil frying, air frying or oven bake" },
  { id: "r-bulk-eggs",        name: "Eggs Large 30 x 12",                    category: "Bulk & Pantry", price: 799.99, unit: "each", note: "R66.58 per tray; R2.21 per egg; in stock; baking or breakfast needs" },
  { id: "r-bulk-veg-mix",     name: "Mix Veg (10 x 1kg)",                    category: "Bulk & Pantry", price: 29.99,  unit: "each", note: "Frozen 1kg x 10 bags; in stock" },
  { id: "r-bulk-veg-corn",    name: "Corn (10 x 1kg)",                       category: "Bulk & Pantry", price: 35.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-green-beans", name: "Green Beans (10 x 1kg)",            category: "Bulk & Pantry", price: 35.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-broccoli", name: "Broccoli (10 x 1kg)",                  category: "Bulk & Pantry", price: 34.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-diced-carrot", name: "Diced Carrot (10 x 1kg)",          category: "Bulk & Pantry", price: 34.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-butternut", name: "Butternut (10 x 1kg)",                category: "Bulk & Pantry", price: 35.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-cauliflower", name: "Cauliflower (10 x 1kg)",            category: "Bulk & Pantry", price: 35.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-hawai",   name: "Hawai Mix (10 x 1kg)",                  category: "Bulk & Pantry", price: 35.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-carrot-round", name: "Carrot Round (10 x 1kg)",          category: "Bulk & Pantry", price: 30.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-country", name: "Country Crop (10 x 1kg)",               category: "Bulk & Pantry", price: 35.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-peas",    name: "Peas (10 x 1kg)",                       category: "Bulk & Pantry", price: 35.99,  unit: "each", note: "Frozen 1kg x 10 bags; on order" },
  { id: "r-bulk-veg-country-mix", name: "Country Mix (10 x 1kg)",            category: "Bulk & Pantry", price: 39.99,  unit: "each", note: "Frozen 1kg x 10 bags; in stock" },
  { id: "r-bulk-veg-broccoli-florets", name: "Broccoli Florets (6 x 1kg)",   category: "Bulk & Pantry", price: 42.99,  unit: "each", note: "Frozen 1kg x 6 bags; on order" },
  { id: "r-bulk-veg-mix-900", name: "Mix Veg (10 x 900g)",                   category: "Bulk & Pantry", price: 34.99,  unit: "each", note: "Frozen 900g x 10 bags; on order" },
  { id: "r-bulk-veg-mushroom", name: "Mushroom Pieces & Stems (10 x 1kg)",   category: "Bulk & Pantry", price: 37.99,  unit: "each", note: "Frozen 1kg x 10 bags" },

  // Budget Items
  { id: "r-bdg-chk-necks-1",  name: "Chicken Necks",                         category: "Budget Items",  price: 29.99,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "r-bdg-chk-necks-s",  name: "Chicken Necks Tray",                    category: "Budget Items",  price: 10.00,  unit: "each", note: "Frozen 280g tray; in stock; for smaller portions or resale" },
  { id: "r-bdg-chk-liver-1",  name: "Chicken Liver 1kg",                     category: "Budget Items",  price: 27.99,  unit: "each", note: "1kg bags; in stock" },
  { id: "r-bdg-chk-liver-270", name: "Chicken Liver 270G",                   category: "Budget Items",  price: 10.00,  unit: "each", note: "Packed in 270g trays; in stock; for smaller portions or resale" },
  { id: "r-bdg-chk-liver-frozen", name: "Chicken Liver Frozen 1kg",          category: "Budget Items",  price: 29.99,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "r-bdg-chk-liver-tray", name: "Chicken Liver Tray",                  category: "Budget Items",  price: 10.00,  unit: "each", note: "Frozen 270g tray; in stock; for smaller portions or resale" },
  { id: "r-bdg-giz-1",        name: "Chicken Gizzards",                      category: "Budget Items",  price: 42.99,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "r-bdg-giz-s",        name: "Chicken Gizzards Tray",                 category: "Budget Items",  price: 13.99,  unit: "each", note: "Frozen 250g tray; in stock; for smaller portions or resale" },
  { id: "r-bdg-skins-s",      name: "Chicken Skins Tray",                    category: "Budget Items",  price: 10.00,  unit: "each", note: "Frozen 300g tray; in stock" },
  { id: "r-bdg-chunks-1",     name: "Chicken Chunks",                        category: "Budget Items",  price: 25.00,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "r-bdg-chunks-s",     name: "Chicken Chunks Tray",                   category: "Budget Items",  price: 10.00,  unit: "each", note: "Frozen 300g tray; in stock; for smaller portions or resale" },
  { id: "r-bdg-bones",        name: "Meaty Bones Wild",                      category: "Budget Items",  price: 0,      priceLabel: "N/S", unit: "kg", note: "Frozen box, 20kg; in stock" },
  { id: "r-bdg-bones-s",      name: "Meaty Bones Wild Trays",                category: "Budget Items",  price: 0,      priceLabel: "N/S", unit: "each", note: "Frozen 700g tray; in stock; for smaller portions or resale" },
  { id: "r-bdg-gbf-patty",    name: "Ground Beef Style Patties",             category: "Budget Items",  price: 4.00,   unit: "each", note: "Frozen 80g patty, 100mm; in stock" },
  { id: "r-bdg-gbf-patty-tray", name: "Ground Beef Style Patties Tray",      category: "Budget Items",  price: 0,      priceLabel: "N/S", unit: "each", note: "80g patties x 4 per tray; in stock; for resale" },
  { id: "r-bdg-gbf-mball",    name: "Ground Beef Style Meatballs",           category: "Budget Items",  price: 0,      priceLabel: "N/S", unit: "each", note: "40g meatballs; in stock" },
  { id: "r-bdg-gbf-mball-tray", name: "Ground Beef Style Meatballs Tray",    category: "Budget Items",  price: 0,      priceLabel: "N/S", unit: "each", note: "40g meatballs x 10 per tray; in stock" },
  { id: "r-bdg-gbf-mince",    name: "Ground Beef Style Mince",               category: "Budget Items",  price: 30.00,  unit: "each", note: "Frozen 1kg bags; made on order; made with your budget in mind" },
  { id: "r-bdg-gbf-mince-tray", name: "Ground Beef Style Mince Tray",        category: "Budget Items",  price: 10.00,  unit: "each", note: "Frozen 300g tray; made on order; for smaller portions or resale" },
  { id: "r-bdg-pol-250",      name: "French Polony 250G",                    category: "Budget Items",  price: 10.00,  unit: "each", note: "Fresh 250g roll; made on order; ready to eat" },
  { id: "r-bdg-pol-garl",     name: "Garlic French Polony 250G",             category: "Budget Items",  price: 10.00,  unit: "each", note: "Fresh 250g roll; made on order; ready to eat" },
  { id: "r-bdg-pol-chk",      name: "Chicken Polony 250G",                   category: "Budget Items",  price: 10.00,  unit: "each", note: "Fresh 250g roll; made on order; ready to eat" },
  { id: "r-bdg-pol-1.8",      name: "French Polony 1.8kg",                   category: "Budget Items",  price: 59.99,  unit: "each", note: "Fresh 1.8kg roll; made on order; ready to eat / great for sandwiches" },
]);

// ---------------------------------------------------------------------------
// WHOLESALE (prices incl. VAT)
// ---------------------------------------------------------------------------
export const WHOLESALE_PRODUCTS: Product[] = withProductPhotos([

  // -- Chicken ---------------------------------------------------------------
  { id: "w-chk-fillet",       name: "Chicken Fillet",                        category: "Chicken",       price: 68.99,  unit: "kg",   note: "Fresh 5kg bag; in stock; lean fillet for whatever you need", minQty: 5, qtyStep: 5 },
  { id: "w-chk-wings",        name: "Chicken Wings",                         category: "Chicken",       price: 73.59,  unit: "kg",   note: "Individually frozen in 5kg bags; not injected; in stock", minQty: 5, qtyStep: 5 },
  { id: "w-chk-thighs",       name: "Chicken Thighs",                        category: "Chicken",       price: 59.79,  unit: "kg",   note: "Individually frozen in 5kg bags; not injected; in stock", minQty: 5, qtyStep: 5 },
  { id: "w-chk-drums",        name: "Chicken Drumsticks",                    category: "Chicken",       price: 74.74,  unit: "kg",   note: "Individually frozen in 5kg bags; not injected; in stock", minQty: 5, qtyStep: 5 },
  { id: "w-chk-whole",        name: "Chicken Whole (Grilliers)",             category: "Chicken",       price: 55.19,  unit: "kg",   note: "Fresh 10 units in a box; specific size can be requested; on order", minQty: 1, qtyStep: 1 },
  { id: "w-chk-fillet-pizza", name: "Chicken Fillet Pizza Pieces",           category: "Chicken",       price: 74.74,  unit: "kg",   note: "1kg bags; cut smaller than 1cm; made on order" },
  { id: "w-chk-stew",         name: "Chicken Stew",                          category: "Chicken",       price: 59.79,  unit: "kg",   note: "Chicken fillet and thighs; made on order" },
  { id: "w-chk-buff",         name: "Chicken Buffalo Wings",                 category: "Chicken",       price: 80.49,  unit: "kg",   note: "Any quantity; made on order; great for platters, parties and braais" },
  { id: "w-chk-buff-lh",      name: "Chicken Buffalo Wings Marinated L&H",   category: "Chicken",       price: 71.29,  unit: "kg",   note: "Marinated Lemon & Herb buffalo wings; in stock" },
  { id: "w-chk-buff-bbq",     name: "Chicken Buffalo Wings Marinated BBQ",   category: "Chicken",       price: 71.29,  unit: "kg",   note: "Marinated Tangy BBQ buffalo wings; in stock" },
  { id: "w-chk-buff-peri",    name: "Chicken Buffalo Wings Marinated Peri",  category: "Chicken",       price: 71.29,  unit: "kg",   note: "Marinated Peri Peri buffalo wings; in stock" },
  { id: "w-chk-buff-sc",      name: "Chicken Buffalo Wings Marinated S/C",   category: "Chicken",       price: 71.29,  unit: "kg",   note: "Marinated Sweet Chilli buffalo wings; in stock" },

  // -- Beef ------------------------------------------------------------------
  { id: "w-beef-striploin-karan", name: "Striploin (Karan)",                 category: "Beef",          price: 166.74, unit: "kg",   note: "Fresh box; in stock; cut your own steaks" },
  { id: "w-beef-rump-a-karan",    name: "Rump A (Karan)",                    category: "Beef",          price: 149.49, unit: "kg",   note: "Fresh box; on order; cut your own steaks" },
  { id: "w-beef-rump-tail",       name: "Rump Tail",                         category: "Beef",          price: 137.99, unit: "kg",   note: "Fresh box; in stock; cut your own steaks or kebabs" },
  { id: "w-beef-silverside-a",    name: "Silverside A",                      category: "Beef",          price: 103.49, unit: "kg",   note: "Fresh box; in stock; biltong or tenderized steak" },
  { id: "w-beef-topside-a",       name: "Topside A",                         category: "Beef",          price: 103.49, unit: "kg",   note: "Fresh box; in stock; biltong or tenderized steak" },
  { id: "w-beef-knuckle-a",       name: "Knuckle A",                         category: "Beef",          price: 109.24, unit: "kg",   note: "Fresh box; in stock; goulash, strips, mince or wors" },
  { id: "w-beef-crops-karan",     name: "Crops (Karan)",                     category: "Beef",          price: 103.49, unit: "kg",   note: "Fresh box; made on order; steaks or kebabs" },
  { id: "w-beef-shin",        name: "Soft Shin",                             category: "Beef",          price: 109.24, unit: "kg",   note: "Fresh box; in stock; best mixed with more boney meat for stew" },
  { id: "w-beef-fillet",      name: "Fillet",                                category: "Beef",          price: 275.99, unit: "kg",   note: "Fresh box; on order; steak" },
  { id: "w-beef-bolo",        name: "Bolo 0/1",                              category: "Beef",          price: 103.49, unit: "kg",   note: "Fresh box; in stock; all rounder" },
  { id: "w-beef-rump-c",      name: "Rump C0/1",                             category: "Beef",          price: 103.49, unit: "kg",   note: "Fresh box; in stock; all rounder" },
  { id: "w-beef-body-fat",    name: "Body Fat",                              category: "Beef",          price:  32.19, unit: "kg",   note: "Frozen box; in stock; high quality fat" },
  { id: "w-beef-marrow",      name: "Marrow Bones",                          category: "Beef",          price:  27.59, unit: "kg",   note: "Frozen box; on order; soup or toast" },
  { id: "w-beef-tender",      name: "Beef Tenderize Steak",                  category: "Beef",          price: 137.99, unit: "kg",   note: "Any quantity; made on order" },
  { id: "w-beef-karan-cut",   name: "(Karan) Beef Sirloin Portioned",        category: "Beef",          price: 229.99, unit: "kg",   note: "Size requested; made on order", minQty: 0.5, qtyStep: 0.1 },
  { id: "w-beef-goulash",     name: "Beef Goulash or Strips",                category: "Beef",          price: 120.74, unit: "kg",   note: "Any quantity; made on order; stews, pies and stroganoff" },
  { id: "w-beef-boneless-stew", name: "Beef Boneless Stew",                  category: "Beef",          price: 114.99, unit: "kg",   note: "Any quantity; in stock; great boneless stew" },
  { id: "w-beef-stew-bone",   name: "Beef Stew (With Bone)",                 category: "Beef",          price:  97.74, unit: "kg",   note: "Any quantity; in stock; great bone-in stew" },
  { id: "w-beef-boerewors",   name: "Boerewors",                             category: "Beef",          price:  86.24, unit: "kg",   note: "Fresh or frozen packed in trays, 400g-1kg; in stock", minQty: 0.4, qtyStep: 0.1 },

  // -- Minces ----------------------------------------------------------------
  { id: "w-mince-80",         name: "Beef Steak Mince 80/20",                category: "Minces",        price:  91.99, unit: "kg",   note: "Fresh vacuumed 5kg bags; made on order", minQty: 5, qtyStep: 5 },
  { id: "w-mince-90",         name: "Beef Lean Steak Mince 90/10",           category: "Minces",        price: 103.49, unit: "kg",   note: "Fresh vacuumed 5kg bags; made on order", minQty: 5, qtyStep: 5 },
  { id: "w-mince-95",         name: "Beef Ultra Lean Steak Mince 95/5",      category: "Minces",        price: 120.74, unit: "kg",   note: "Any quantity; made on order" },

  // -- Ostrich ---------------------------------------------------------------
  { id: "w-ost-trim",         name: "Ostrich Trim",                          category: "Ostrich",       price:  97.74, unit: "kg",   note: "Frozen box; ask for availability; lean trim for goulash or strips" },
  { id: "w-ost-steaks",       name: "Ostrich Steak",                         category: "Ostrich",       price: 103.49, unit: "kg",   note: "Fresh or frozen 2.5kg bags; ask for availability; lean steaks", minQty: 2.5, qtyStep: 2.5 },
  { id: "w-ost-hearts",       name: "Ostrich Hearts",                        category: "Ostrich",       price:  39.09, unit: "kg",   note: "Frozen 10kg average bags; ask for availability" },

  // -- Lamb ------------------------------------------------------------------
  { id: "w-lamb-a0-braai",    name: "Lamb A0 Braaichops",                    category: "Lamb",          price: 137.99, unit: "kg",   note: "Fresh or frozen; on order; lean braai chops" },
  { id: "w-lamb-a0-loin",     name: "Lamb A0 Loin Chops",                    category: "Lamb",          price: 149.49, unit: "kg",   note: "Fresh or frozen; on order; lean loin chops" },
  { id: "w-lamb-stew",        name: "Lamb Stew",                             category: "Lamb",          price: 149.49, unit: "kg",   note: "Fresh or frozen; on order" },
  { id: "w-lamb-ribs",        name: "Lamb A1/2 Ribs",                        category: "Lamb",          price: 149.49, unit: "kg",   note: "Fresh or frozen; on order; best ribs to braai and baste" },
  { id: "w-lamb-riblets",     name: "Lamb A1/2 Riblets",                     category: "Lamb",          price: 149.49, unit: "kg",   note: "Fresh or frozen; on order; best riblets to braai and baste" },
  { id: "w-lamb-kidneys",     name: "Lamb Kidneys",                          category: "Lamb",          price: 114.99, unit: "kg",   note: "Frozen; can be packed in trays or bags; on order" },
  { id: "w-lamb-kidneys-cut", name: "Lamb Kidneys Cut",                      category: "Lamb",          price:  45.99, unit: "kg",   note: "Frozen 5kg bag; in stock; cut for pie production", minQty: 5, qtyStep: 5 },

  // -- Cheese ----------------------------------------------------------------
  { id: "w-ch-mozloaf-mini",  name: "Mozzarella Loaf Mini",                  category: "Cheese",        price: 126.49, unit: "kg",   note: "Fresh 200g +/- vacuumed; in stock; retail purposes", minQty: 0.2, qtyStep: 0.1 },
  { id: "w-ch-mozgr",         name: "Mozzarella Grated",                     category: "Cheese",        price: 110.39, unit: "kg",   note: "Frozen 2kg bags; in stock; production purposes", minQty: 2, qtyStep: 2 },
  { id: "w-ch-chedloaf-mini", name: "Cheddar Loaf Mini",                     category: "Cheese",        price: 126.49, unit: "kg",   note: "Fresh 200g +/- vacuumed; in stock; retail purposes", minQty: 0.2, qtyStep: 0.1 },
  { id: "w-ch-chedgr",        name: "Cheddar Grated",                        category: "Cheese",        price: 110.39, unit: "kg",   note: "Frozen 2kg bags; in stock; production purposes", minQty: 2, qtyStep: 2 },
  { id: "w-ch-gouda-mini",    name: "Gouda Loaf Mini",                       category: "Cheese",        price: 126.49, unit: "kg",   note: "Fresh 200g +/- vacuumed; in stock; retail purposes", minQty: 0.2, qtyStep: 0.1 },
  { id: "w-ch-pizza",         name: "Pizza Mix Grated",                      category: "Cheese",        price: 110.39, unit: "kg",   note: "Frozen 2kg bags; in stock; production purposes", minQty: 2, qtyStep: 2 },

  // -- Fish ------------------------------------------------------------------
  { id: "w-fish-hake",        name: "Hake Steaks",                           category: "Fish",          price: 143.74, unit: "kg",   note: "100g-330g individually wrapped; made on order" },
  { id: "w-fish-finger-tray", name: "Fish Finger Tray",                      category: "Fish",          price:  20.70, unit: "each", note: "10 fish fingers per tray; made on order" },
  { id: "w-fish-cakes-tray",  name: "Fish Cakes Tray",                       category: "Fish",          price:  18.40, unit: "each", note: "5 fish cakes per tray; made on order" },

  // -- Ready to Cook ---------------------------------------------------------
  { id: "w-prep-ost-port",    name: "Ostrich Steaks Portioned",              category: "Ready to Cook", price: 34.49,  unit: "each", note: "Fresh vacuumed, 270g-300g; on order" },
  { id: "w-prep-wagyu",       name: "Beef Wagyu Burgers",                    category: "Ready to Cook", price: 30.00,  unit: "each", note: "Fresh or frozen 150g, 130mm; in stock" },
  { id: "w-prep-wors-bf",     name: "Boerewors Breakfast",                   category: "Ready to Cook", price: 10.34,  unit: "each", note: "Fresh or frozen 80g-100g / 15cm; in stock" },
  { id: "w-prep-wors-hd",     name: "Boerewors Hotdog",                      category: "Ready to Cook", price: 11.49,  unit: "each", note: "Fresh or frozen 100g-120g / 15cm; in stock" },
  { id: "w-prep-wors-ft",     name: "Boerewors Footlong",                    category: "Ready to Cook", price: 13.79,  unit: "each", note: "Fresh or frozen 130g-150g / 22cm; in stock" },
  { id: "w-prep-beef-mball",  name: "Beef Meatballs 40G",                    category: "Ready to Cook", price:  3.78,  unit: "each", note: "Fresh or frozen 40g; in stock" },
  { id: "w-prep-beef-patty-s",name: "Beef Patties (100g)",                   category: "Ready to Cook", price: 11.49,  unit: "each", note: "Fresh or frozen 100g, 100mm; in stock" },
  { id: "w-prep-beef-patty-l",name: "Beef Patties (150g)",                   category: "Ready to Cook", price: 13.79,  unit: "each", note: "Fresh or frozen 150g, 130mm; in stock" },
  { id: "w-prep-jalapeno",    name: "Beef Jalapeno Patties",                 category: "Ready to Cook", price: 11.49,  unit: "each", note: "Fresh or frozen 100g, 100mm; in stock" },
  { id: "w-prep-chk-patty",   name: "Chicken Patties",                       category: "Ready to Cook", price:  8.04,  unit: "each", note: "Frozen 120g, 100mm; in stock" },
  { id: "w-prep-chk-mball",   name: "Chicken Meatballs 40G",                 category: "Ready to Cook", price:  3.44,  unit: "each", note: "Frozen 40g; made on order" },
  { id: "w-prep-bbq-patty",   name: "Beef BBQ Cheese Patties",               category: "Ready to Cook", price: 11.49,  unit: "each", note: "Fresh or frozen 100g, 100mm; in stock" },
  { id: "w-prep-beef-kb60",   name: "Rump Steak Kebab 60G",                  category: "Ready to Cook", price: 13.79,  unit: "each", note: "Rump steak with green pepper & onions; made on order" },
  { id: "w-prep-beef-kb100",  name: "Rump Steak Kebab 100G",                 category: "Ready to Cook", price: 18.39,  unit: "each", note: "Rump steak with green pepper & onions; made on order" },
  { id: "w-prep-beef-kb150",  name: "Rump Steak Kebab 150G",                 category: "Ready to Cook", price: 27.59,  unit: "each", note: "Rump steak with green pepper & onions; made on order" },
  { id: "w-prep-beef-kb200",  name: "Rump Steak Kebab 200G",                 category: "Ready to Cook", price: 40.24,  unit: "each", note: "Rump steak with green pepper & onions; made on order" },
  { id: "w-prep-chk-kb60",    name: "Chicken Fillet Kebab 60G",              category: "Ready to Cook", price:  9.19,  unit: "each", note: "Chicken fillet with green pepper & onions; made on order" },
  { id: "w-prep-chk-kb100",   name: "Chicken Fillet Kebab 100G",             category: "Ready to Cook", price: 13.79,  unit: "each", note: "Chicken fillet with green pepper & onions; made on order" },
  { id: "w-prep-chk-kb150",   name: "Chicken Fillet Kebab 150G",             category: "Ready to Cook", price: 27.59,  unit: "each", note: "Chicken fillet with green pepper & onions; made on order" },
  { id: "w-prep-chk-kb200",   name: "Chicken Fillet Kebab 200G",             category: "Ready to Cook", price: 27.59,  unit: "each", note: "Chicken fillet with green pepper & onions; made on order" },
  { id: "w-prep-chk-med",     name: "Chicken Fillet P/Medium",              category: "Ready to Cook", price: 11.49,  unit: "each", note: "Fresh or frozen 140g-160g; in stock" },
  { id: "w-prep-chk-lrg",     name: "Chicken Fillet P/Large",               category: "Ready to Cook", price: 14.94,  unit: "each", note: "Fresh or frozen 165g-205g; in stock" },
  { id: "w-prep-leg-med",     name: "Chicken Leg Q P/Medium",               category: "Ready to Cook", price: 16.09,  unit: "each", note: "Fresh or frozen 240g-275g; in stock" },
  { id: "w-prep-leg-lrg",     name: "Chicken Leg Q P/Large",                category: "Ready to Cook", price: 18.39,  unit: "each", note: "Fresh or frozen 280g-305g; in stock" },
  { id: "w-prep-leg-xl",      name: "Chicken Leg Q P/X Large",              category: "Ready to Cook", price: 18.96,  unit: "each", note: "Fresh or frozen 310g-340g; in stock" },

  // -- Bulk & Pantry ---------------------------------------------------------
  { id: "w-bulk-chips-fresh", name: "Chips Fresh 7mm/10mm/12mm",             category: "Bulk & Pantry", price: 14.99, unit: "kg",   note: "No VAT; made fresh on order; lasts 5 days in the fridge" },
  { id: "w-bulk-chips-7",     name: "Chips 7mm",                             category: "Bulk & Pantry", price: 35.99, unit: "each", note: "No VAT; frozen 2.5kg bags x 4 in a box; in stock" },
  { id: "w-bulk-chips-10",    name: "Chips 10mm",                            category: "Bulk & Pantry", price: 29.99, unit: "each", note: "No VAT; frozen 2.5kg bags x 6 in a box; on order" },
  { id: "w-bulk-chips-12",    name: "Chips 12mm",                            category: "Bulk & Pantry", price: 29.99, unit: "each", note: "No VAT; frozen 2.5kg bags x 6 in a box; on order" },
  { id: "w-bulk-eggs",        name: "Eggs Large 30 x 12 (No VAT)",           category: "Bulk & Pantry", price: 779.99, unit: "each", note: "No VAT; R72.50 per tray; R2.42 per egg; in stock" },
  { id: "w-bulk-veg-mix",     name: "Mix Veg (10 x 1kg)",                    category: "Bulk & Pantry", price:  29.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; in stock" },
  { id: "w-bulk-veg-corn",    name: "Corn (10 x 1kg)",                       category: "Bulk & Pantry", price:  34.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-green-beans", name: "Green Beans (10 x 1kg)",            category: "Bulk & Pantry", price:  34.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-broccoli", name: "Broccoli (10 x 1kg)",                  category: "Bulk & Pantry", price:  34.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-diced-carrot", name: "Diced Carrot (10 x 1kg)",          category: "Bulk & Pantry", price:  34.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-cauliflower", name: "Cauliflower (10 x 1kg)",            category: "Bulk & Pantry", price:  33.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-hawai",   name: "Hawai Mix (10 x 1kg)",                  category: "Bulk & Pantry", price:  33.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-carrot-round", name: "Carrot Round (10 x 1kg)",          category: "Bulk & Pantry", price:  30.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-country", name: "Country Crop (10 x 1kg)",               category: "Bulk & Pantry", price:  32.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-peas",    name: "Peas (10 x 1kg)",                       category: "Bulk & Pantry", price:  34.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-country-mix", name: "Country Mix (10 x 1kg)",            category: "Bulk & Pantry", price:  37.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },
  { id: "w-bulk-veg-broccoli-florets", name: "Broccoli Florets (6 x 1kg)",   category: "Bulk & Pantry", price:  41.99, unit: "each", note: "No VAT; frozen 1kg x 6 bags; on order" },
  { id: "w-bulk-veg-mix-900", name: "Mix Veg (10 x 900g)",                   category: "Bulk & Pantry", price:  34.99, unit: "each", note: "No VAT; frozen 900g x 10 bags; on order" },
  { id: "w-bulk-veg-mushroom", name: "Mushroom Pieces & Stems (10 x 1kg)",   category: "Bulk & Pantry", price:  37.99, unit: "each", note: "No VAT; frozen 1kg x 10 bags; on order" },

  // -- Budget Items ----------------------------------------------------------
  { id: "w-budget-chk-necks-1", name: "Chicken Necks",                       category: "Budget Items", price: 28.74,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "w-budget-chk-necks-tray", name: "Chicken Necks Tray",               category: "Budget Items", price:  9.19,  unit: "each", note: "Frozen 280g tray; in stock; for smaller portions or resale" },
  { id: "w-budget-chk-liver-1", name: "Chicken Liver",                       category: "Budget Items", price: 27.59,  unit: "each", note: "1kg bags; in stock" },
  { id: "w-budget-chk-liver-270", name: "Chicken Liver 270G",                category: "Budget Items", price:  9.19,  unit: "each", note: "Packed in 270g trays; in stock; for smaller portions or resale" },
  { id: "w-budget-chk-liver-frozen", name: "Chicken Liver Frozen 1kg",       category: "Budget Items", price: 28.74,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "w-budget-giz-1",      name: "Chicken Gizzards/Maggies",             category: "Budget Items", price: 41.39,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "w-budget-giz-tray",   name: "Chicken Gizzards/Maggies Tray",        category: "Budget Items", price: 13.79,  unit: "each", note: "Frozen 250g tray; in stock; for smaller portions or resale" },
  { id: "w-budget-skins-tray", name: "Chicken Skins Tray",                   category: "Budget Items", price:  9.19,  unit: "each", note: "Frozen 300g tray; in stock; for smaller portions or resale" },
  { id: "w-budget-chunks-1",   name: "Chicken Chunks",                       category: "Budget Items", price: 28.74,  unit: "each", note: "Frozen 1kg bags; in stock" },
  { id: "w-budget-chunks-tray", name: "Chicken Chunks Tray",                 category: "Budget Items", price:  9.19,  unit: "each", note: "Frozen 300g tray; in stock; for smaller portions or resale" },
  { id: "w-budget-wild-bones", name: "Meaty Bones Wild",                     category: "Budget Items", price: 22.99,  unit: "kg",   note: "Frozen 20kg box; in stock" },
  { id: "w-budget-bones-tray", name: "Meaty Bones Wild Trays",               category: "Budget Items", price: 20.00,  unit: "each", note: "Frozen 700g tray; in stock; for smaller portions or resale" },
  { id: "w-budget-gbf-patty",  name: "Ground Beef Style Patties",            category: "Budget Items", price:  4.01,  unit: "each", note: "Frozen 80g patty, 100mm; in stock" },
  { id: "w-budget-gbf-patty-tray", name: "Ground Beef Style Patties Tray",   category: "Budget Items", price: 16.00,  unit: "each", note: "4 patties per tray; in stock; for resale" },
  { id: "w-budget-gbf-mball",  name: "Ground Beef Style Meatballs",          category: "Budget Items", price:  2.00,  unit: "each", note: "40g meatball; in stock" },
  { id: "w-budget-gbf-mball-tray", name: "Ground Beef Style Meatballs Tray", category: "Budget Items", price: 11.99,  unit: "each", note: "10 meatballs per tray; in stock" },
  { id: "w-budget-gbf-mince",  name: "Ground Beef Style Mince",              category: "Budget Items", price: 30.00,  unit: "each", note: "Frozen 1kg bags; made on order" },
  { id: "w-budget-gbf-mince-tray", name: "Ground Beef Style Mince Tray",     category: "Budget Items", price:  9.19,  unit: "each", note: "Frozen 300g tray; made on order; for smaller portions or resale" },
  { id: "w-budget-pol-250",    name: "French Polony 250g",                   category: "Budget Items", price:  9.19,  unit: "each", note: "Fresh 250g roll; made on order; ready to eat" },
  { id: "w-budget-pol-garl",   name: "Garlic French Polony 250g",            category: "Budget Items", price:  9.19,  unit: "each", note: "Fresh 250g roll; made on order; ready to eat" },
  { id: "w-budget-pol-chk",    name: "Chicken Polony 250g",                  category: "Budget Items", price:  9.19,  unit: "each", note: "Fresh 250g roll; made on order; ready to eat" },
  { id: "w-budget-polony",     name: "French Polony 1.8kg",                  category: "Budget Items", price: 57.49,  unit: "each", note: "Fresh 1.8kg roll; made on order; ready to eat" },
]);
export const CATEGORY_ORDER: Record<OrderType, string[]> = {
  retail:    ["Beef", "Minces", "Lamb", "Chicken", "Ostrich", "Fish", "Ready to Cook", "Cheese", "Bulk & Pantry", "Budget Items"],
  wholesale: ["Beef", "Minces", "Lamb", "Chicken", "Ostrich", "Fish", "Cheese", "Ready to Cook", "Bulk & Pantry", "Budget Items"],
};
