import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import type { GooglePlacePrediction, PlaceSuggestion } from '../models/google-places.models';
import { environment } from '../../../environments/environment.prod';

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

  searchPlaces(query: string, sessionToken: string): Observable<GooglePlacePrediction[]> {
    if (!query.trim()) return of([]);

    return this.http.post<{ data: { suggestions: GooglePlacePrediction[] } }>(
      `${environment.apiUrl}/places/autocomplete`,
      { input: query }
    ).pipe(
      map(res => res?.data.suggestions ?? []),
      catchError(() => of([]))
    );
  }
}
