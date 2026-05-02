export const environment = {
  production: false,
  /** ngx-translate: loads `/i18n/{lang}.json` from this app (e.g. ng serve on port 4200). */
  translateLoaderPrefix: '/i18n/',
  //translateLoaderPrefix: 'https://soletechs.net/property.admin/i18/',
  apiUrl: 'http://localhost:3000',
  //apiUrl: 'https://soletechs.net/property.api',
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
