export interface PropertyFeature {
  _id: string;
  name: string;
  slug: string;
  position: number;
}

export interface PropertyFeaturesData {
  features: PropertyFeature[];
}

/** Response from GET /api/property-features */
export interface PropertyFeaturesApiResponse {
  success: boolean;
  count?: number;
  data: PropertyFeaturesData;
}
