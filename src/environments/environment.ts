export const environment = {
  production: false,
  //translateLoaderPrefix: '/i18n/',
  translateLoaderPrefix: 'https://soletechs.net/property.admin/i18/',
  apiUrl: 'https://soletechs.net/property.api',
  wsUrl:  'https://soletechs.net/property.api',  //socket handshake  same server, different path 

  //apiUrl: 'http://localhost:3000',
  //wsUrl:  'http://localhost:3000',  //socket handshake  same server, different path 
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
