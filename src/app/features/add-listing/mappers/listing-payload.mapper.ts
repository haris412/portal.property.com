import type { CreateListingPayload } from '../../../core/models/add-listing.model';
import type { ListingAmenityBooleans } from '../../../core/constants/listing-payload.constants';
import type { ListingImagePayload } from '../../../core/services/media-upload.service';
import type { LocationHierarchyItem } from '../../../core/models/google-places.models';

export interface UploadedMediaPayload {
  images: ListingImagePayload[];
  videoTourUrl: string | null;
}

export interface ListingFormSnapshot {
  basic: {
    purpose:        string;
    propertyTypeId: string;  // category _id
    subtypeId:      string;  // subtype  _id
    listingTitle:   string;
  };
  description: {
    propertyDescription: string;
  };
  pricing: {
    price:            number | null;
    areaSize:         number | null;
    areaUnit:         string | null;
    numBedrooms:      number | null;
    numBathrooms:     number | null;
    numParkingSpaces: number | null;
    numFloors:        number | null;
  };
  contact: {
    contactName:        string | null;
    contactEmail:       string | null;
    contactPhoneNumber: string | null;
    contactLocation:    string | null;
  };
  location: {
    locationHierarchy: LocationHierarchyItem[];
    fullAddress:       string | null;
    mapLink:           string | null;
    zipCode:           string | null;
    latitude:          number | null;
    longitude:         number | null;
  };
}

export function buildListingPayload(
  forms:           ListingFormSnapshot,
  uploadedMedia:   UploadedMediaPayload,
  amenityBooleans: ListingAmenityBooleans,
  isFeatured:      boolean
): CreateListingPayload {
  const { basic, description, pricing, contact, location } = forms;

  return {
    // Basic
    purpose:             basic.purpose === 'sale' ? 'For Sale' : 'For Rent',
    listingTitle:        (basic.listingTitle ?? '').trim(),
    propertyDescription: (description.propertyDescription ?? '').trim(),
    propertyTypeId:      basic.propertyTypeId,   // category _id → backend resolves name
    subtypeId:           basic.subtypeId,         // subtype  _id → backend resolves name
    // Pricing
    price:            pricing.price            ?? null,
    areaSize:         pricing.areaSize         ?? null,
    areaUnit:         pricing.areaUnit         ?? null,
    numBedrooms:      pricing.numBedrooms      ?? null,
    numBathrooms:     pricing.numBathrooms     ?? null,
    numParkingSpaces: pricing.numParkingSpaces ?? null,
    numFloors:        pricing.numFloors        ?? null,
    // Media
    images:      uploadedMedia.images,
    videoTourUrl: uploadedMedia.videoTourUrl,
    // Location
    location:    location.locationHierarchy ?? [],
    latitude:    location.latitude          ?? null,
    longitude:   location.longitude         ?? null,
    fullAddress: location.fullAddress       ?? null,
    mapLink:     location.mapLink           ?? null,
    zipCode:     location.zipCode           ?? null,
    // Contact
    contactName:        contact.contactName        ?? null,
    contactEmail:       contact.contactEmail       ?? null,
    contactPhoneNumber: contact.contactPhoneNumber ?? null,
    contactLocation:    contact.contactLocation    ?? null,
    // Meta + amenities
    isFeatured,
    ...amenityBooleans,
  };
}
