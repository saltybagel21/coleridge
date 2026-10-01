export const SPIT_PACKAGE_IDS = [
  "package-1", "package-2", "package-3", "package-4", "package-5", "package-6",
] as const;

export type SpitPackageId = (typeof SPIT_PACKAGE_IDS)[number];

export type SpitPackage = {
  id: SpitPackageId;
  name: string;
  price: number;
  shortDescription: string;
  included: string[];
  note: string;
};

export type SpitPackageConfig = {
  visibleCount: number;
  packages: SpitPackage[];
};

export type SpitPackagePrices = Record<SpitPackageId, number>;

const defaultPrices = [150, 165, 125, 0, 0, 0];

export const defaultSpitPackageConfig = (): SpitPackageConfig => ({
  visibleCount: 3,
  packages: SPIT_PACKAGE_IDS.map((id, index) => ({
    id,
    name: `Package ${index + 1}`,
    price: defaultPrices[index],
    shortDescription: index === 2 ? "per person · budget option" : "per person",
    included: [],
    note: "",
  })),
});

export const formatSpitPrice = (price: number) =>
  `R${(Number.isInteger(price) ? price.toFixed(0) : price.toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
