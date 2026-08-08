export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}
export interface GooglePlaceStructuredFormat {
  mainText: GooglePlaceText;
  secondaryText?: GooglePlaceText;
}
export interface GooglePlacePrediction {
  place: string;
  placeId: string;
  text: GooglePlaceText;
  structuredFormat: GooglePlaceStructuredFormat;
  types: string[];
}
export interface GooglePlaceTextMatch {
  startOffset: number;
  endOffset: number;
}
export interface GooglePlaceText {
  text: string;
  matches?: GooglePlaceTextMatch[];
}
export interface PlaceAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  addressComponents: PlaceAddressComponent[];
}

export interface LocationHierarchyItem {
  id?: string;
  level: number;
  name: string;
}
