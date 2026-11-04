import type { ApiPathToControlMap } from '../../../core/http/apply-server-field-errors';

export const ADD_LISTING_BASIC_INFO_API_MAP: ApiPathToControlMap = {
  listingTitle:   'listingTitle',
  title:          'listingTitle',
  purpose:        'purpose',
  propertyTypeId: 'propertyTypeId',
  subtypeId:      'subtypeId',
};

export const ADD_LISTING_DESCRIPTION_API_MAP: ApiPathToControlMap = {
  propertyDescription: 'propertyDescription',
  description:         'propertyDescription',
};

export const ADD_LISTING_PRICING_API_MAP: ApiPathToControlMap = {
  price:            'price',
  areaSize:         'areaSize',
  areaUnit:         'areaUnit',
  numBedrooms:      'numBedrooms',
  numBathrooms:     'numBathrooms',
  numParkingSpaces: 'numParkingSpaces',
  numFloors:        'numFloors',
};

export const ADD_LISTING_LOCATION_API_MAP: ApiPathToControlMap = {
  location:    'locationHierarchy',
  fullAddress: 'fullAddress',
  mapLink:     'mapLink',
  latitude:    'latitude',
  longitude:   'longitude',
};

export const ADD_LISTING_CONTACT_API_MAP: ApiPathToControlMap = {
  contactName:        'contactName',
  contactEmail:       'contactEmail',
  contactPhoneNumber: 'contactPhoneNumber',
  contactPhone:       'contactPhoneNumber',
  phone:              'contactPhoneNumber',
  contactLocation:    'contactLocation',
};

// this will neeed to pick from backend

export const ADD_LISTING_SHARED_API_MAP: ApiPathToControlMap = {
  isShared:                          'isShared',
  'sharedDetails.roomsAvailable':    'details.roomsAvailable',
  'sharedDetails.bathroom':          'details.bathroom',
  'sharedDetails.kitchen':           'details.kitchen',
  'sharedDetails.livingRoom':        'details.livingRoom',
  'sharedDetails.laundry':           'details.laundry',
  'sharedDetails.entrance':          'details.entrance',
  'sharedDetails.currentOccupants':  'details.currentOccupants',
  'sharedDetails.tenantPreference':  'details.tenantPreference',
  'sharedDetails.utilitiesIncluded': 'details.utilitiesIncluded',
};
