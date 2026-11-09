importScripts('https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDTAMhcvnnulJV0aGzmRfGUleEml0wSfEc',
  authDomain: 'propertypark-7698d.firebaseapp.com',
  projectId: 'propertypark-7698d',
  storageBucket: 'propertypark-7698d.firebasestorage.app',
  messagingSenderId: '573071943420',
  appId: '1:573071943420:web:3c2a025fd350ed989f1979',
  measurementId: 'G-4VHZ959H99',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;

  const title = payload.data?.title || 'New notification';
  const options = {
    body: payload.data?.body || '',
    data: { url: payload.data?.url || '/' },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin);
  if (url.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((windowClient) => 'focus' in windowClient);
      if (client && 'focus' in client) {
        return client.navigate(url.href).then(() => client.focus());
      }
      return self.clients.openWindow(url.href);
    }),
  );
});