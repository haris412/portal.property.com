export const environment = {
  production: false,
  translateLoaderPrefix: '/i18n/',
  firebase: {
    apiKey: 'AIzaSyDTAMhcvnnulJV0aGzmRfGUleEml0wSfEc',
    authDomain: 'propertypark-7698d.firebaseapp.com',
    projectId: 'propertypark-7698d',
    storageBucket: 'propertypark-7698d.firebasestorage.app',
    messagingSenderId: '573071943420',
    appId: '1:573071943420:web:3c2a025fd350ed989f1979',
    measurementId: 'G-4VHZ959H99',
    messagingVapidKey:
      'BEFVw9GUBk5XkFUraj7FzfO0-T9hFZjvWNkOJ91YhspM-jJpz3SfCY_jfYrgwqGuIyUGrzyv8UsxXFJwdu2JHOU',
    messagingServiceWorkerUrl: '/firebase-messaging-sw.js',
  },
  //translateLoaderPrefix: 'https://soletechs.net/property.admin/i18/',
  //apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
  //wsUrl:  'https://soletechs.net/property.api',  //socket handshake  same server, different path
  /** Public marketing site — anonymous video guests return here after leaving a call. */
  publicSiteUrl: 'https://soletechs.net/property.web/home',

  apiUrl: 'https://soletechs.net/property.api',
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
