export const environment = {
  production: false,
  translateLoaderPrefix: '/i18n/',
  //  translateLoaderPrefix: 'https://soletechs.net/property.admin/i18/',
   apiUrl: 'http://localhost:3000/api',
   wsUrl:  'http://localhost:3000',  //socket handshake  same server, different path 

  //apiUrl: 'https://soletechs.net/property.api',
  newRtcUrl: 'http://localhost:8000',
  geonames: {
    username: 'harissaeed',
    userAgent: 'Propertify(harissaeed214@gmail.com)',
  },
  overpass: {
    interpreterUrl: 'https://overpass-api.de/api/interpreter',
  },
  googlePlaces: {
    apiKey: 'AIzaSyCQhyzoeFIoSD3XYRnHxxwmnaWrBqBv-Io',
  },
};
