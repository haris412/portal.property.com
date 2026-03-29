import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { GeolocationService } from '../../../../core/services/geolocation.service';

type LatLng = { lat: number; lng: number };

function toGoogleMapsLink({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

@Component({
  selector: 'app-location-map-picker',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './location-map-picker.html',
  styleUrl: './location-map-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationMapPickerComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly geolocation = inject(GeolocationService);

  @Input({ required: true }) form!: FormGroup;
  @Input() heightPx = 220;

  readonly locating = signal(false);
  readonly geoError = signal<string | null>(null);

  @ViewChild('mapContainer', { static: true }) private readonly mapContainer!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    this.configureLeafletIcons();
    this.initMap();
    this.bindForm();
  }

  private initMap(): void {
    const initial = this.readFormLatLng() ?? { lat: 31.5204, lng: 74.3587 }; // Lahore default

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initial.lat, initial.lng], this.readFormLatLng() ? 15 : 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    this.setMarker(initial, { moveMap: false });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const next = { lat: e.latlng.lat, lng: e.latlng.lng };
      this.writeFormLatLng(next);
      this.setMarker(next, { moveMap: false });
    });

    // If the map is inside a flex/card layout, its container may report 0x0 on first pass.
    // Invalidate size after paint so tiles + marker render correctly.
    queueMicrotask(() => this.map?.invalidateSize());
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  useMyLocation(): void {
    this.geoError.set(null);
    this.locating.set(true);
    this.geolocation
      .getCurrentPosition()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.locating.set(false))
      )
      .subscribe({
        next: (point) => {
          const next = { lat: point.lat, lng: point.lng };
          this.writeFormLatLng(next);
          this.setMarker(next, { moveMap: true });
          queueMicrotask(() => this.map?.invalidateSize());
          requestAnimationFrame(() => this.map?.invalidateSize());
        },
        error: (err: unknown) => {
          this.geoError.set(this.geolocation.userFacingMessage(err));
        },
      });
  }

  private bindForm(): void {
    const latCtrl = this.form.get('latitude');
    const lngCtrl = this.form.get('longitude');
    if (!latCtrl || !lngCtrl) {
      return;
    }

    // Keep marker in sync when lat/lng are edited programmatically (e.g. future geocode).
    this.form.valueChanges
      .pipe(
        debounceTime(50),
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged((a, b) => a?.latitude === b?.latitude && a?.longitude === b?.longitude)
      )
      .subscribe(() => {
        const ll = this.readFormLatLng();
        if (!ll) {
          return;
        }
        this.setMarker(ll, { moveMap: true });
      });
  }

  private setMarker(latLng: LatLng, opts: { moveMap: boolean }): void {
    if (!this.map) {
      return;
    }

    if (!this.marker) {
      this.marker = L.marker([latLng.lat, latLng.lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const p = this.marker?.getLatLng();
        if (!p) {
          return;
        }
        const next = { lat: p.lat, lng: p.lng };
        this.writeFormLatLng(next);
      });
    } else {
      this.marker.setLatLng([latLng.lat, latLng.lng]);
    }

    if (opts.moveMap) {
      this.map.setView([latLng.lat, latLng.lng], Math.max(this.map.getZoom(), 15), { animate: true });
    }
  }

  private readFormLatLng(): LatLng | null {
    const lat = this.form.get('latitude')?.value;
    const lng = this.form.get('longitude')?.value;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  }

  private writeFormLatLng(latLng: LatLng): void {
    this.form.patchValue(
      {
        latitude: latLng.lat,
        longitude: latLng.lng,
        mapLink: toGoogleMapsLink(latLng),
      },
      { emitEvent: true }
    );
  }

  private configureLeafletIcons(): void {
    // Fix default marker icons in bundlers (Angular builder doesn't auto-resolve Leaflet image URLs).
    const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
    const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
    const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();
    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
  }
}

