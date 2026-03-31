export interface BasicInformationPayload {
  purpose: string | null;
  /**
   * Coarse type used by the listing API (e.g. House | Apartment | Plot).
   * Derived from selected category/subtype labels.
   */
  propertyType: string | null;
  /**
   * Detail type shown in UI (e.g. "Upper Portion"); API expects it as `subtype` / `propertySubtype`.
   */
  subtype?: string | null;
  /** Display labels from the catalog dropdowns. */
  propertyCategoryName?: string | null;
  propertySubtypeName?: string | null;
  title: string | null;
  description: string | null;
}

export interface PricingDetailsPayload {
  price: number | null;
  currency?: string | null;
  area?: number | null;
  areaUnit?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

export interface FeaturesAmenitiesPayload {
  amenities: string[];
}

export interface MediaItemPayload {
  type: 'photo' | 'floorplan' | 'video' | string;
  url?: string;
}

export interface PropertyMediaPayload {
  media: MediaItemPayload[];
}

export interface LocationPayload {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ContactInformationPayload {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp' | string | null;
}

export interface AddListingModel {
  basicInformation: BasicInformationPayload;
  pricingDetails: PricingDetailsPayload;
  featuresAmenities: FeaturesAmenitiesPayload;
  propertyMedia: PropertyMediaPayload;
  location: LocationPayload;
  contactInformation: ContactInformationPayload;
  isDraft?: boolean;
}

