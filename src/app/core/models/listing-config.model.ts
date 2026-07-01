import type { PropertyCatalogData } from './property-catalog.model';
import type { PropertyFeature } from './property-features.model';

export interface ListingConfigData {
  catalog:  PropertyCatalogData;
  features: PropertyFeature[];
}

export interface ListingConfigApiResponse {
  success: boolean;
  data: {
    catalog:  PropertyCatalogData;
    features: PropertyFeature[];
  };
}
