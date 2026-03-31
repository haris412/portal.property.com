/** Overpass JSON element (`out body` / `out center` on ways). */
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  /** Present on `way` when using `out center`. */
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements?: OverpassElement[];
}

/** Mapped OSM suburb / neighbourhood for UI pickers. */
export interface OsmAreaSuggestion {
  osmId: number;
  name: string;
  place: 'suburb' | 'neighbourhood';
  lat: number;
  lon: number;
}

export type OsmPickKind = 'suburb' | 'neighbourhood' | 'road' | 'restaurant';

/** Unified row for area / road / restaurant autocomplete (merged Overpass sources). */
export interface OsmLocationPickItem {
  osmId: number;
  osmType: 'node' | 'way';
  kind: OsmPickKind;
  name: string;
  lat: number;
  lon: number;
}
