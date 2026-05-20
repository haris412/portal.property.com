import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  LocationHierarchyItem,
  PlaceAddressComponent,
  PlaceDetails,
  PlaceSuggestion,
} from '../models/google-places.models';

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places';
const DETAILS_FIELD_MASK = 'id,formattedAddress,location,addressComponents';

const GOOGLE_TYPE_TO_LEVEL: Readonly<Record<string, number>> = {
  country: 0,
  administrative_area_level_1: 1,
  locality: 2,
  sublocality: 3,
  administrative_area_level_2: 3,
  sublocality_level_1: 3,
  neighborhood: 4,
  sublocality_level_2: 4,
  sublocality_level_3: 4,
  sublocality_level_4: 4,
};

// Raw Google Places API response shapes (internal use only)
interface AutocompleteApiResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
}

interface PlaceDetailsApiResponse {
  id?: string;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
}

@Injectable({ providedIn: 'root' })
export class GooglePlacesService {
  private readonly httpClient: HttpClient;
  private readonly apiKey = environment.googlePlaces.apiKey;

  constructor(backend: HttpBackend) {
    // Bypass all HTTP interceptors so auth headers are never sent to Google's API.
    this.httpClient = new HttpClient(backend);
  }

  searchPlaces(input: string, sessionToken: string): Observable<PlaceSuggestion[]> {
    const trimmed = input.trim();
    if (!trimmed) return of([]);

    return this.httpClient
      .post<AutocompleteApiResponse>(
        AUTOCOMPLETE_URL,
        { input: trimmed, sessionToken, includedRegionCodes: ['pk'] },
        { headers: new HttpHeaders({ 'X-Goog-Api-Key': this.apiKey }) }
      )
      .pipe(
        map(res => this.mapSuggestions(res)),
        catchError(() => of([] as PlaceSuggestion[]))
      );
  }

  getPlaceDetails(placeId: string, sessionToken: string): Observable<PlaceDetails | null> {
    const url = `${PLACE_DETAILS_BASE_URL}/${encodeURIComponent(placeId)}`;
    return this.httpClient
      .get<PlaceDetailsApiResponse>(url, {
        headers: new HttpHeaders({
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': DETAILS_FIELD_MASK,
        }),
        params: { sessionToken },
      })
      .pipe(
        map(res => this.mapPlaceDetails(res)),
        catchError(() => of(null))
      );
  }

  buildLocationHierarchy(placeId: string, components: PlaceAddressComponent[]): LocationHierarchyItem[] {
    const levelMap = new Map<number, LocationHierarchyItem>();

    for (const component of components) {
      let bestLevel = -1;
      for (const type of component.types) {
        const level = GOOGLE_TYPE_TO_LEVEL[type];
        if (level !== undefined && level > bestLevel) {
          bestLevel = level;
        }
      }
      if (bestLevel < 0 || levelMap.has(bestLevel)) continue;
      levelMap.set(bestLevel, { level: bestLevel, name: component.longText });
    }

    const sorted = Array.from(levelMap.values()).sort((a, b) => a.level - b.level);

    // Remove consecutive entries with the same name (e.g. "Lahore" city + "Lahore" district).
    const items = sorted.filter(
      (item, i) => i === 0 || item.name.toLowerCase() !== sorted[i - 1].name.toLowerCase()
    );

    // Only the leaf (selected place) carries the Google Place ID.
    if (items.length > 0) {
      const leaf = items[items.length - 1];
      items[items.length - 1] = { ...leaf, id: placeId };
    }

    return items;
  }

  private mapSuggestions(res: AutocompleteApiResponse): PlaceSuggestion[] {
    return (res.suggestions ?? [])
      .map(s => {
        const p = s.placePrediction;
        if (!p?.placeId) return null;
        return {
          placeId: p.placeId,
          mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
          secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
        } satisfies PlaceSuggestion;
      })
      .filter((s): s is PlaceSuggestion => s !== null);
  }

  private mapPlaceDetails(res: PlaceDetailsApiResponse): PlaceDetails {
    return {
      placeId: res.id ?? '',
      formattedAddress: res.formattedAddress ?? '',
      latitude: res.location?.latitude ?? 0,
      longitude: res.location?.longitude ?? 0,
      addressComponents: (res.addressComponents ?? []).map(c => ({
        longText: c.longText ?? '',
        shortText: c.shortText ?? '',
        types: c.types ?? [],
      })),
    };
  }
}
