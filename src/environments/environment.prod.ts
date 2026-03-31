export const environment = {
  production: true,
  apiUrl: '', // set your production API URL
  geonames: {
    // If the app is served on https://, keep https here; http:// GeoNames would be blocked (mixed content).
    baseUrl: 'https://api.geonames.org',
    username: 'harissaeed',
    userAgent: 'Propertify(harissaeed214@gmail.com)',
  },
  overpass: {
    interpreterUrl: 'https://overpass-api.de/api/interpreter',
  },
};
