export const SPIT_PACKAGES = [
  { id: "package-1", label: "Package 1", desc: "per person", defaultPrice: 150 },
  { id: "package-2", label: "Package 2", desc: "per person", defaultPrice: 165 },
  { id: "package-3", label: "Package 3", desc: "per person · budget option", defaultPrice: 125 },
] as const;

export type SpitPackageId = (typeof SPIT_PACKAGES)[number]["id"];
export type SpitPackagePrices = Record<SpitPackageId, number>;

export const defaultSpitPackagePrices = (): SpitPackagePrices => ({
  "package-1": 150,
  "package-2": 165,
  "package-3": 125,
});

export const formatSpitPrice = (price: number) =>
  `R${(Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
