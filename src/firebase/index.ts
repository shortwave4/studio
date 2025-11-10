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

  // We need to check for window because `isSupported()` depends on browser features.
  // We can initialize storage and other services on the server, but messaging requires the browser.
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        // This is async, but we'll get the instance when needed.
        // For now, we are just starting the check.
        try {
          messaging = getMessaging(firebaseApp);
        } catch (e) {
          console.error("Failed to initialize messaging", e);
        }
      }
    });
  }
  
  // Storage can be initialized on both server and client.
  // The issue was caching a null storage object from the server run.
  // By initializing it outside the window check, we ensure it's always available.

  firebaseServices = {
    firebaseApp,
    auth,
    firestore,
    storage, // Now storage is always initialized
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