/** GeoNames `searchJSON` row (populated places). */
export interface GeoNameAdminCodes1 {
  ISO3166_2?: string;
}

export interface GeoNamePlace {
  adminCode1?: string;
  lng: string;
  geonameId: number;
  toponymName: string;
  countryId?: string;
  fcl: string;
  population: number;
  countryCode: string;
  name: string;
  fclName?: string;
  adminCodes1?: GeoNameAdminCodes1;
  countryName?: string;
  fcodeName?: string;
  adminName1?: string;
  lat: string;
  fcode: string;
}

export interface GeoNamesSearchResponse {
  totalResultsCount: number;
  geonames?: GeoNamePlace[];
}
