import type { LocationHierarchyItem } from './google-places.models';
import type { ListingImagePayload } from '../services/media-upload.service';

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
  status?:             string;
}
