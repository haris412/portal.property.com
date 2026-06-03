import type { ApiPathToControlMap } from '../../../core/http/apply-server-field-errors';

/** Backend `errors[].path` (and aliases) → `basicInfoForm` control names. */
export const ADD_LISTING_BASIC_INFO_API_MAP: ApiPathToControlMap = {
  title: 'listingTitle',
  listingTitle: 'listingTitle',
  purpose: 'purpose',
  propertyCategoryName: 'propertyCategoryName',
  propertySubtypeName: 'propertySubtypeName',
  propertyType: 'propertyCategoryName',
  subtype: 'propertySubtypeName',
};

export const ADD_LISTING_DESCRIPTION_API_MAP: ApiPathToControlMap = {
  propertyDescription: 'propertyDescription',
  description: 'propertyDescription',
};

export const ADD_LISTING_PRICING_API_MAP: ApiPathToControlMap = {
  price: 'price',
  areaSize: 'areaSize',
  areaUnit: 'areaUnit',
  numBedrooms: 'numBedrooms',
  numBathrooms: 'numBathrooms',
  numParkingSpaces: 'numParkingSpaces',
  numFloors: 'numFloors',
};

export const ADD_LISTING_LOCATION_API_MAP: ApiPathToControlMap = {
  location: 'locationHierarchy',
  fullAddress: 'fullAddress',
  mapLink: 'mapLink',
  latitude: 'latitude',
  longitude: 'longitude',
};

export const ADD_LISTING_CONTACT_API_MAP: ApiPathToControlMap = {
  contactName: 'contactName',
  contactEmail: 'contactEmail',
  contactPhoneNumber: 'contactPhoneNumber',
  contactPhone: 'contactPhoneNumber',
  phone: 'contactPhoneNumber',
  contactLocation: 'contactLocation',
};
