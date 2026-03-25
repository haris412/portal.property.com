import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GeolocationPoint {
  lat: number;
  lng: number;
  /** Horizontal accuracy radius in meters (lower is typically better). */
  accuracyMeters: number;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20_000,
};

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  /**
   * One-shot high-accuracy position from the browser Geolocation API.
   * Requires a secure context (HTTPS or localhost) and user permission.
   */
  getCurrentPosition(options?: PositionOptions): Observable<GeolocationPoint> {
    return new Observable((subscriber) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        subscriber.error(new Error('Geolocation is not supported in this environment.'));
        return;
      }

      const merged: PositionOptions = { ...DEFAULT_OPTIONS, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          subscriber.next({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
          });
          subscriber.complete();
        },
        (err) => {
          subscriber.error(err);
        },
        merged
      );
    });
  }

  userFacingMessage(error: unknown): string {
    if (this.isGeolocationPositionError(error)) {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          return 'Location access was denied. Allow location in your browser settings, or place the pin on the map.';
        case 2: // POSITION_UNAVAILABLE
          return 'Your position could not be determined. Try again or set the location on the map.';
        case 3: // TIMEOUT
          return 'Location request timed out. Try again (GPS works best outdoors) or set the location on the map.';
        default:
          return 'Could not get your location.';
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Could not get your location.';
  }

  private isGeolocationPositionError(error: unknown): error is GeolocationPositionError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }
}
