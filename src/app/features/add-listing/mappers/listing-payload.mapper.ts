import type { CreateListingPayload } from '../../../core/models/add-listing.model';
import type { ListingImagePayload } from '../../../core/services/media-upload.service';
import type { LocationHierarchyItem } from '../../../core/models/google-places.models';

export interface UploadedMediaPayload {
  images:      ListingImagePayload[];
  videoTourUrl: string | null;
}

export interface ListingFormSnapshot {
  basic: {
    purpose:        string;
    propertyTypeId: string;
    subtypeId:      string;
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
  amenities: {
    selectedFeatureIds: string[];
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
  forms:         ListingFormSnapshot,
  uploadedMedia: UploadedMediaPayload,
  isFeatured:    boolean
): CreateListingPayload {
  const { basic, description, pricing, amenities, contact, location } = forms;

  return {
    purpose:             basic.purpose === 'sale' ? 'For Sale' : 'For Rent',
    listingTitle:        (basic.listingTitle ?? '').trim(),
    propertyDescription: (description.propertyDescription ?? '').trim(),
    propertyTypeId:      basic.propertyTypeId,
    subtypeId:           basic.subtypeId,
    featureIds:          amenities.selectedFeatureIds ?? [],
    price:               pricing.price            ?? null,
    areaSize:            pricing.areaSize         ?? null,
    areaUnit:            pricing.areaUnit         ?? null,
    numBedrooms:         pricing.numBedrooms      ?? null,
    numBathrooms:        pricing.numBathrooms     ?? null,
    numParkingSpaces:    pricing.numParkingSpaces ?? null,
    numFloors:           pricing.numFloors        ?? null,
    images:              uploadedMedia.images,
    videoTourUrl:        uploadedMedia.videoTourUrl,
    location:            location.locationHierarchy ?? [],
    latitude:            location.latitude          ?? null,
    longitude:           location.longitude         ?? null,
    fullAddress:         location.fullAddress       ?? null,
    mapLink:             location.mapLink           ?? null,
    zipCode:             location.zipCode           ?? null,
    contactName:         contact.contactName        ?? null,
    contactEmail:        contact.contactEmail       ?? null,
    contactPhoneNumber:  contact.contactPhoneNumber ?? null,
    contactLocation:     contact.contactLocation    ?? null,
    isFeatured,
  };
}
