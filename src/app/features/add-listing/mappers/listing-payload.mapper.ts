import type { CreateListingPayload } from '../../../core/models/add-listing.model';
import type { ListingImagePayload } from '../../../core/services/media-upload.service';
import type { LocationHierarchyItem } from '../../../core/models/google-places.models';
import type { SharedDetails } from '../../../core/models/shared-listing.model';

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
    placeId:           string | null;
    fullAddress:       string | null;
    mapLink:           string | null;
    zipCode:           string | null;
    latitude:          number | null;
    longitude:         number | null;
  };
  shared: {
    isShared: boolean;
    details: {
      roomsAvailable:    number | null;
      bathroom:          string;
      kitchen:           string;
      livingRoom:        string;
      laundry:           string;
      entrance:          string;
      currentOccupants:  number | null;
      tenantPreference:  string;
      utilitiesIncluded: boolean;
    };
  };
}

export function buildListingPayload(
  forms:         ListingFormSnapshot,
  uploadedMedia: UploadedMediaPayload,
  isFeatured:    boolean
): CreateListingPayload {
  const { basic, description, pricing, amenities, contact, location, shared } = forms;
  const sharedDetails = shared.isShared ? buildSharedDetails(shared.details) : null;
  console.log('Building listing payload with forms:', forms, 'and uploaded media:', uploadedMedia, 'isFeatured:', isFeatured);
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
    // location intentionally forced empty in every payload — hierarchy is disabled for now.
    location:            [],
    placeId:             location.placeId           ?? null,
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
    // backend clears sharedDetails on isShared:false and rejects sharedDetails unless isShared is true
    isShared:            sharedDetails != null,
    ...(sharedDetails ? { sharedDetails } : {}),
  };
}

/** Full object every time — a PUT replaces sharedDetails wholesale. Empty optional fields are omitted. */
function buildSharedDetails(details: ListingFormSnapshot['shared']['details']): SharedDetails {
  const occupants = details.currentOccupants as number | string | null;
  const out: SharedDetails = {
    roomsAvailable:    Number(details.roomsAvailable),
    bathroom:          details.bathroom as SharedDetails['bathroom'],
    kitchen:           details.kitchen  as SharedDetails['kitchen'],
    tenantPreference:  (details.tenantPreference || 'Any') as SharedDetails['tenantPreference'],
    utilitiesIncluded: Boolean(details.utilitiesIncluded),
  };
  if (details.livingRoom) out.livingRoom = details.livingRoom as SharedDetails['livingRoom'];
  if (details.laundry)    out.laundry    = details.laundry    as SharedDetails['laundry'];
  if (details.entrance)   out.entrance   = details.entrance   as SharedDetails['entrance'];
  if (occupants != null && occupants !== '') out.currentOccupants = Number(occupants);
  return out;
}
