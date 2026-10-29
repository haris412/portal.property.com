import type { LocationHierarchyItem } from './google-places.models';
import type { ListingImagePayload } from '../services/media-upload.service';
import type { SharedDetails } from './shared-listing.model';

export interface CreateListingPayload {
  purpose:             string;
  listingTitle:        string;
  propertyDescription: string;
  propertyTypeId:      string;
  subtypeId:           string;
  featureIds:          string[];
  price:               number | null;
  areaSize:            number | null;
  areaUnit:            string | null;
  numBedrooms:         number | null;
  numBathrooms:        number | null;
  numParkingSpaces:    number | null;
  numFloors:           number | null;
  images:              ListingImagePayload[];
  videoTourUrl:        string | null;
  location:            LocationHierarchyItem[];
  placeId:             string | null;
  latitude:            number | null;
  longitude:           number | null;
  fullAddress:         string | null;
  mapLink:             string | null;
  zipCode:             string | null;
  contactName:         string | null;
  contactEmail:        string | null;
  contactPhoneNumber:  string | null;
  contactLocation:     string | null;
  isFeatured:          boolean;
  isShared:            boolean;
  /** Only sent when `isShared` is true; a PUT replaces the whole object. */
  sharedDetails?:      SharedDetails;
  status?:             string;
}
