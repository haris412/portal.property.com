import type { PropertyFeature } from './property-features.model';

export interface PropertyDetailDocument {
  _id?:         string;
  userId?:      string | { _id?: string; firstName?: string; lastName?: string; email?: string } | null;
  purpose?:     string | null;
  propertyTypeId?: string | null;
  subtypeId?:      string | null;
  propertyType?:   string | null;
  subtype?:        string | null;
  listingTitle?:        string | null;
  propertyDescription?: string | null;
  price?:            number | null;
  areaSize?:         number | null;
  areaUnit?:         string | null;
  numBedrooms?:      number | null;
  numBathrooms?:     number | null;
  numParkingSpaces?: number | null;
  numFloors?:        number | null;
  featureIds?: PropertyFeature[] | null;
  contactName?:        string | null;
  contactEmail?:       string | null;
  contactPhoneNumber?: string | null;
  contactLocation?:    string | null;
  city?:         string | null;
  neighborhood?: string | null;
  location?:     { id?: string; level: number; name: string }[] | null;
  fullAddress?:  string | null;
  mapLink?:      string | null;
  latitude?:     number | null;
  longitude?:    number | null;
  images?:       { url?: string }[] | null;
  videoTourUrl?: string | null;
  isFeatured?:   boolean | null;
}

export interface PropertyDetailApiResponse {
  success:   boolean;
  data?:     { property?: PropertyDetailDocument };
  message?:  string;
}
