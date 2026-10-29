import { buildListingPayload, type ListingFormSnapshot } from './listing-payload.mapper';

function snapshot(shared: Partial<ListingFormSnapshot['shared']> = {}): ListingFormSnapshot {
  return {
    basic:       { purpose: 'rent', propertyTypeId: 'homes', subtypeId: 'house', listingTitle: 'Room in 3-bed house' },
    description: { propertyDescription: 'Nice room' },
    pricing:     { price: 25000, areaSize: 1200, areaUnit: 'sqft', numBedrooms: 3, numBathrooms: 2, numParkingSpaces: 0, numFloors: 1 },
    amenities:   { selectedFeatureIds: [] },
    contact:     { contactName: null, contactEmail: null, contactPhoneNumber: null, contactLocation: null },
    location:    { locationHierarchy: [], placeId: null, fullAddress: null, mapLink: null, zipCode: null, latitude: null, longitude: null },
    shared: {
      isShared: false,
      details: {
        roomsAvailable: 1, bathroom: 'Attached', kitchen: 'Shared', livingRoom: '', laundry: '', entrance: '',
        currentOccupants: null, tenantPreference: 'Any', utilitiesIncluded: false,
      },
      ...shared,
    },
  };
}

const media = { images: [], videoTourUrl: null };

describe('buildListingPayload — shared listing', () => {
  it('sends isShared:false and omits sharedDetails when not shared', () => {
    const payload = buildListingPayload(snapshot(), media, false);
    expect(payload.isShared).toBe(false);
    expect('sharedDetails' in payload).toBe(false);
  });

  it('sends the full sharedDetails object when shared, skipping empty optional fields', () => {
    const payload = buildListingPayload(snapshot({ isShared: true }), media, false);
    expect(payload.isShared).toBe(true);
    expect(payload.sharedDetails).toEqual({
      roomsAvailable: 1, bathroom: 'Attached', kitchen: 'Shared', tenantPreference: 'Any', utilitiesIncluded: false,
    });
  });

  it('includes filled optional fields and a 0 occupant count', () => {
    const base = snapshot().shared.details;
    const payload = buildListingPayload(snapshot({
      isShared: true,
      details: { ...base, livingRoom: 'Shared', entrance: 'Separate', currentOccupants: 0, tenantPreference: 'Students', utilitiesIncluded: true },
    }), media, false);
    expect(payload.sharedDetails).toEqual({
      roomsAvailable: 1, bathroom: 'Attached', kitchen: 'Shared', livingRoom: 'Shared', entrance: 'Separate',
      currentOccupants: 0, tenantPreference: 'Students', utilitiesIncluded: true,
    });
  });
});
