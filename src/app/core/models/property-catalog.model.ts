/** Subtype under a top-level category (e.g. House, Flat under Homes). */
export interface PropertyCatalogSubtype {
  _id: string;
  name: string;
  slug: string;
}

/** Top-level category from GET /api/property-catalog (e.g. Homes, Plots, Commercial). */
export interface PropertyCatalogCategory {
  _id: string;
  name: string;
  slug: string;
  coarseType: string;  // backend provides this — no regex needed on frontend
  subtypes: PropertyCatalogSubtype[];
}

export interface PropertyCatalogData {
  categories: PropertyCatalogCategory[];
}
