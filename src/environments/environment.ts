export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  geonames: {
    // Match senior URL (http). Use https in prod if your site is served over https (mixed content).
    baseUrl: 'http://api.geonames.org',
    username: 'harissaeed',
    userAgent: 'Propertify(harissaeed214@gmail.com)',
  },
  /** OpenStreetMap Overpass API (suburbs / neighbourhoods around a city point). */
  overpass: {
    interpreterUrl: 'https://overpass-api.de/api/interpreter',
  },
};
