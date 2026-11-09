import { getApps, initializeApp } from 'firebase/app';

import { environment } from '../../../environments/environment';

export function initializeFirebaseApp(): void {
  const config = environment.firebase;

  if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
    return;
  }

  if (getApps().some((app) => app.name === '[DEFAULT]')) {
    return;
  }

  initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    measurementId: config.measurementId,
  });
}