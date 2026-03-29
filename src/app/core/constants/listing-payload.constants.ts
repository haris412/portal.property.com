/** API expects `propertyType` as one of these coarse values. */
export type CoarsePropertyType = 'House' | 'Apartment' | 'Plot';

/** Boolean amenity fields on create/update property payload (matches backend contract). */
export interface ListingAmenityBooleans {
  hasWifi: boolean;
  hasSwimmingPool: boolean;
  hasGym: boolean;
  hasGarage: boolean;
  hasCentralAc: boolean;
  hasBalcony: boolean;
  hasSecurity: boolean;
  hasGarden: boolean;
  hasElevator: boolean;
  hasLaundryRoom: boolean;
  isFurnished: boolean;
  isPetFriendly: boolean;
}

export function createDefaultListingAmenityBooleans(): ListingAmenityBooleans {
  return {
    hasWifi: false,
    hasSwimmingPool: false,
    hasGym: false,
    hasGarage: false,
    hasCentralAc: false,
    hasBalcony: false,
    hasSecurity: false,
    hasGarden: false,
    hasElevator: false,
    hasLaundryRoom: false,
    isFurnished: false,
    isPetFriendly: false,
  };
}

export function normalizeFeatureSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
}

/**
 * Maps `GET /api/property-features` item `slug` (normalized) → payload key.
 * Add aliases here if the API uses different slugs.
 */
export const FEATURE_SLUG_TO_AMENITY_KEY: Record<string, keyof ListingAmenityBooleans> = {
  wifi: 'hasWifi',
  'wi-fi': 'hasWifi',
  pool: 'hasSwimmingPool',
  'swimming-pool': 'hasSwimmingPool',
  gym: 'hasGym',
  garage: 'hasGarage',
  'central-ac': 'hasCentralAc',
  centralac: 'hasCentralAc',
  balcony: 'hasBalcony',
  security: 'hasSecurity',
  garden: 'hasGarden',
  elevator: 'hasElevator',
  'laundry-room': 'hasLaundryRoom',
  laundry: 'hasLaundryRoom',
  furnished: 'isFurnished',
  'pet-friendly': 'isPetFriendly',
  petfriendly: 'isPetFriendly',
};
