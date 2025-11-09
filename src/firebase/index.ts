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
  // If services are already initialized, return them from cache
  if (firebaseServices) {
    return firebaseServices;
  }

  let firebaseApp;
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }

  // Cache the initialized services
  firebaseServices = getSdks(firebaseApp);
  return firebaseServices;
}

export function getSdks(firebaseApp: FirebaseApp) {
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    const storage = getStorage(firebaseApp);
    
    // Conditionally initialize messaging only on the client and if supported
    let messaging = null;
    if (typeof window !== 'undefined') {
        isSupported().then(supported => {
            if (supported) {
                messaging = getMessaging(firebaseApp);
            }
        });
    }

    return {
        firebaseApp,
        auth,
        firestore,
        messaging,
        storage,
    };
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