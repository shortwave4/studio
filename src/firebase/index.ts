'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Global cache for Firebase services to ensure single initialization
let firebaseServices: {
    firebaseApp: FirebaseApp;
    auth: ReturnType<typeof getAuth>;
    firestore: ReturnType<typeof getFirestore>;
    storage: ReturnType<typeof getStorage>;
    messaging: ReturnType<typeof getMessaging> | null;
} | null = null;


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (firebaseServices) {
    return firebaseServices;
  }

  let firebaseApp: FirebaseApp;
  // Check if any app is already initialized
  if (getApps().length === 0) {
    // If not, initialize a new app
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // If apps are already initialized, get the default app
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  let messaging = null;

  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(firebaseApp);
      }
    });
  }

  firebaseServices = {
    firebaseApp,
    auth,
    firestore,
    storage,
    messaging,
  };

  return firebaseServices;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './messaging';
