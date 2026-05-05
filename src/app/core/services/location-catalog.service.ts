import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { GeoNamePlace, GeoNamesSearchResponse } from '../models/geonames.models';
import type {
  OsmAreaSuggestion,
  OsmLocationPickItem,
  OsmPickKind,
  OverpassResponse,
} from '../models/overpass.models';

const GEONAMES_SEARCH_JSON_URL = 'https://secure.geonames.org/searchJSON';

const POPULATED_PLACE_FEATURE_CODES = [
  'PPLC',
  'PPLA',
  'PPLA2',
  'PPLA3',
  'PPLA4',
  'PPL',
] as const;

export interface PopulatedPlacesQuery {
  countryCode: string;
  startRow?: number;
  maxRows?: number;
}

const DEFAULT_OSM_BBOX_HALF_DEG = 0.16;

export interface SuburbsAroundPointQuery {
  lat: number;
  lng: number;
  halfSpanDeg?: number;
}

@Injectable({ providedIn: 'root' })
export class LocationCatalogService {
  private readonly http = inject(HttpClient);

  private readonly cache = new Map<string, Observable<GeoNamePlace[]>>();
  private readonly osmCache = new Map<string, Observable<OsmAreaSuggestion[]>>();
  private readonly mergedOsmCache = new Map<string, Observable<OsmLocationPickItem[]>>();

  getPopulatedPlaces(query: PopulatedPlacesQuery): Observable<GeoNamePlace[]> {
    const startRow = query.startRow ?? 0;
    const maxRows = query.maxRows ?? 1000;
    const key = `${query.countryCode}|${startRow}|${maxRows}`;

    let cached = this.cache.get(key);
    if (!cached) {
      const { username } = environment.geonames;
      let params = new HttpParams()
        .set('country', query.countryCode)
        .set('featureClass', 'P')
        .set('maxRows', String(maxRows))
        .set('startRow', String(startRow))
        .set('orderby', 'population')
        .set('username', username);

      for (const code of POPULATED_PLACE_FEATURE_CODES) {
        params = params.append('featureCode', code);
      }

      cached = this.http
        .get<GeoNamesSearchResponse>(GEONAMES_SEARCH_JSON_URL, { params })
        .pipe(
          map((res) => res.geonames ?? []),
          shareReplay({ bufferSize: 1, refCount: false })
        );

      this.cache.set(key, cached);
    }

    return cached;
  }

  getSuburbsAndNeighbourhoodsAround(query: SuburbsAroundPointQuery): Observable<OsmAreaSuggestion[]> {
    const half = query.halfSpanDeg ?? DEFAULT_OSM_BBOX_HALF_DEG;
    const lat = query.lat;
    const lng = query.lng;
    const south = lat - half;
    const north = lat + half;
    const west = lng - half;
    const east = lng + half;
    const key = `${lat.toFixed(4)}|${lng.toFixed(4)}|${half}`;

    let cached = this.osmCache.get(key);
    if (!cached) {
      const ql = buildSuburbNeighbourhoodOverpassQl(south, west, north, east);
      const url = environment.overpass.interpreterUrl.replace(/\/$/, '');
      const params = new HttpParams().set('data', ql);

      cached = this.http.get<OverpassResponse>(url, { params }).pipe(
        map((res) => mapOverpassToAreaSuggestions(res)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this.osmCache.set(key, cached);
    }

    return cached;
  }

  getMergedLocationSuggestionsAround(query: SuburbsAroundPointQuery): Observable<OsmLocationPickItem[]> {
    const half = query.halfSpanDeg ?? DEFAULT_OSM_BBOX_HALF_DEG;
    const lat = query.lat;
    const lng = query.lng;
    const south = lat - half;
    const north = lat + half;
    const west = lng - half;
    const east = lng + half;
    const key = `merged|${lat.toFixed(4)}|${lng.toFixed(4)}|${half}`;

    let cached = this.mergedOsmCache.get(key);
    if (!cached) {
      const baseUrl = environment.overpass.interpreterUrl.replace(/\/$/, '');

      const areas$ = this.getSuburbsAndNeighbourhoodsAround(query).pipe(
        catchError(() => of([] as OsmAreaSuggestion[]))
      );

      const restaurantsQl = buildRestaurantOverpassQl(south, west, north, east);
      const restaurants$ = this.executeOverpass(baseUrl, restaurantsQl).pipe(
        map((res) => mapOverpassToRestaurantPickItems(res)),
        catchError(() => of([] as OsmLocationPickItem[]))
      );

      const roadsQl = buildNamedRoadOverpassQl(south, west, north, east);
      const roads$ = this.executeOverpass(baseUrl, roadsQl).pipe(
        map((res) => mapOverpassToRoadPickItems(res)),
        catchError(() => of([] as OsmLocationPickItem[]))
      );

      cached = forkJoin([areas$, restaurants$, roads$]).pipe(
        map(([areas, restaurants, roads]) => mergeOsmPickLists(areas, restaurants, roads)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this.mergedOsmCache.set(key, cached);
    }

    return cached;
  }

  private executeOverpass(baseUrl: string, ql: string): Observable<OverpassResponse> {
    const params = new HttpParams().set('data', ql);
    return this.http.get<OverpassResponse>(baseUrl, { params });
  }
}

function buildSuburbNeighbourhoodOverpassQl(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:25];(node["place"="suburb"](${bbox});node["place"="neighbourhood"](${bbox}););out body;`;
}

function buildRestaurantOverpassQl(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:25];node["amenity"="restaurant"](${bbox});out body;`;
}

function buildNamedRoadOverpassQl(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:25];way["highway"]["name"](${bbox});out center;`;
}

function mapOverpassToAreaSuggestions(res: OverpassResponse): OsmAreaSuggestion[] {
  const raw: OsmAreaSuggestion[] = [];
  for (const el of res.elements ?? []) {
    if (el.type !== 'node') continue;
    const place = el.tags?.['place'];
    if (place !== 'suburb' && place !== 'neighbourhood') continue;
    const lat = el.lat;
    const lon = el.lon;
    if (lat == null || lon == null) continue;
    const name = (el.tags?.['name']?.trim() || el.tags?.['name:en']?.trim() || '').trim();
    if (!name) continue;
    raw.push({
      osmId: el.id,
      name,
      place,
      lat,
      lon,
    });
  }
  raw.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return dedupeOsmAreasByName(raw);
}

function dedupeOsmAreasByName(areas: OsmAreaSuggestion[]): OsmAreaSuggestion[] {
  const seen = new Set<string>();
  const out: OsmAreaSuggestion[] = [];
  for (const a of areas) {
    const k = a.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}

function areaToPickItem(a: OsmAreaSuggestion): OsmLocationPickItem {
  return {
    osmId: a.osmId,
    osmType: 'node',
    kind: a.place,
    name: a.name,
    lat: a.lat,
    lon: a.lon,
  };
}

function mergeOsmPickLists(
  areas: OsmAreaSuggestion[],
  restaurants: OsmLocationPickItem[],
  roads: OsmLocationPickItem[]
): OsmLocationPickItem[] {
  const fromAreas = areas.map(areaToPickItem);
  const all = [...fromAreas, ...roads, ...restaurants];
  const kindOrder: Record<OsmPickKind, number> = {
    suburb: 0,
    neighbourhood: 1,
    road: 2,
    restaurant: 3,
  };
  all.sort((a, b) => {
    const kd = kindOrder[a.kind] - kindOrder[b.kind];
    if (kd !== 0) return kd;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  return dedupeOsmPickItems(all);
}

function dedupeOsmPickItems(items: OsmLocationPickItem[]): OsmLocationPickItem[] {
  const seen = new Set<string>();
  const out: OsmLocationPickItem[] = [];
  for (const it of items) {
    const k = `${it.kind}:${it.name.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function mapOverpassToRestaurantPickItems(res: OverpassResponse): OsmLocationPickItem[] {
  const out: OsmLocationPickItem[] = [];
  for (const el of res.elements ?? []) {
    if (el.type !== 'node') continue;
    if (el.tags?.['amenity'] !== 'restaurant') continue;
    const lat = el.lat;
    const lon = el.lon;
    if (lat == null || lon == null) continue;
    const name = (el.tags?.['name']?.trim() || el.tags?.['name:en']?.trim() || '').trim();
    if (!name) continue;
    out.push({
      osmId: el.id,
      osmType: 'node',
      kind: 'restaurant',
      name,
      lat,
      lon,
    });
  }
  return out;
}

function mapOverpassToRoadPickItems(res: OverpassResponse): OsmLocationPickItem[] {
  const out: OsmLocationPickItem[] = [];
  for (const el of res.elements ?? []) {
    if (el.type !== 'way') continue;
    if (!el.tags?.['highway']) continue;
    const name = (el.tags?.['name']?.trim() || el.tags?.['name:en']?.trim() || '').trim();
    if (!name) continue;
    const c = el.center;
    if (c == null || c.lat == null || c.lon == null) continue;
    out.push({
      osmId: el.id,
      osmType: 'way',
      kind: 'road',
      name,
      lat: c.lat,
      lon: c.lon,
    });
  }
  return out;
}
