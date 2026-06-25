/**
 * Best-effort shape for GET /api/properties/:id.
 * Keep optional so the UI can tolerate backend evolution.
 */
export interface PropertyDetailDocument {
  _id?: string;
  /** Owner ref; may be populated when the API uses populate('userId'). */
  userId?: string | { _id?: string; firstName?: string; lastName?: string; email?: string } | null;
  purpose?: string | null;
  // new ID-based fields (set after our payload change)
  propertyTypeId?: string | null;
  subtypeId?:      string | null;
  // legacy name-based fields (old stored listings)
  propertyType?: string | null;
  subtype?: string | null;
  propertySubtype?: string | null;
  propertyCategoryName?: string | null;
  propertySubtypeName?: string | null;
  listingTitle?: string | null;
  title?: string | null;
  propertyDescription?: string | null;
  description?: string | null;

  price?: number | null;
  areaSize?: number | null;
  areaUnit?: string | null;
  numBedrooms?: number | null;
  numBathrooms?: number | null;
  numParkingSpaces?: number | null;
  numFloors?: number | null;

  contactName?: string | null;
  contactEmail?: string | null;
  contactPhoneNumber?: string | null;
  contactPhone?: string | null;
  phone?: string | null;
  contactLocation?: string | null;

  city?: string | null;
  neighborhood?: string | null;
  /** GeoNames / Google hierarchy saved on create; may be absent on older listings. */
  location?: { id?: string; level: number; name: string }[] | null;
  fullAddress?: string | null;
  mapLink?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  images?: { url?: string }[] | null;
  videoTourUrl?: string | null;
  isFeatured?: boolean | null;
}

export interface PropertyDetailApiResponse {
  success: boolean;
  data?: {
    property?: PropertyDetailDocument;
  };
  message?: string;
}

