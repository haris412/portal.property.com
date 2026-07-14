import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import type { PlaceSuggestion } from '../models/google-places.models';

// Our own backend's envelopes for the places proxy — both already flattened server-side
// (see placesService.js), so Google's raw response shapes never need to be typed here at all.
interface AutocompleteProxyResponse {
  success: boolean;
  data?: { suggestions?: PlaceSuggestion[] };
}

@Injectable({ providedIn: 'root' })
export class GooglePlacesService {
  // Nothing in this service calls Google directly anymore — both calls go through our own
  // backend, so the standard HttpClient (interceptors, auth, base-URL prefixing) is all
  // that's needed, same as every other service in this app.
  private readonly http = inject(HttpClient);

  searchPlaces(input: string, sessionToken: string): Observable<PlaceSuggestion[]> {
    const trimmed = input.trim();
    // Fewer than 3 characters isn't worth a round trip — our backend rejects it anyway
    // (see placesRoutes.js's isLength({ min: 3 })), so skip the call entirely here too.
    if (trimmed.length < 3) return of([]);

    return this.http
      .post<AutocompleteProxyResponse>('/places/autocomplete', { input: trimmed, sessionToken })
      .pipe(
        map(res => res.data?.suggestions ?? []),
        catchError(() => of([] as PlaceSuggestion[]))
      );
  }
}
