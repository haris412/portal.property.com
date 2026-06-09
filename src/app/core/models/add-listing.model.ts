import type { LocationHierarchyItem } from './google-places.models';
import type { ListingAmenityBooleans } from '../constants/listing-payload.constants';
import type { ListingImagePayload } from '../services/media-upload.service';

/** Flat payload the backend create/update endpoints accept. */
export interface CreateListingPayload extends ListingAmenityBooleans {
  // Basic
  purpose: string;
  listingTitle: string;
  propertyDescription: string;
  propertyType: string;
  subtype: string;

  // Pricing
  price: number | null;
  areaSize: number | null;
  areaUnit: string | null;
  numBedrooms: number | null;
  numBathrooms: number | null;
  numParkingSpaces: number | null;
  numFloors: number | null;

  // Media
  images: ListingImagePayload[];
  videoTourUrl: string | null;

  // Location
  location: LocationHierarchyItem[];
  latitude: number | null;
  longitude: number | null;
  fullAddress: string | null;
  mapLink: string | null;
  zipCode: string | null;

  // Contact
  contactName: string | null;
  contactEmail: string | null;
  contactPhoneNumber: string | null;
  contactLocation: string | null;

  // Meta
  isFeatured: boolean;
  status?: string;
}
