export const environment = {
  production: true,
  /**
   * ngx-translate: must match real files on the server (see `public/assets/i18n/`).
   * Use `/property.admin/i18n/` when this app is served under that path on soletechs.net.
   * If the IIS site root is already the app folder, use `/i18n/` instead.
   */
  translateLoaderPrefix: '/property.admin/i18n/',
  apiUrl: 'https://soletechs.net/property.api', // set your production API URL
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
