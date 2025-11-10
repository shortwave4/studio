'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { Firestore, doc, arrayUnion } from 'firebase/firestore';
import { updateDocumentNonBlocking } from './non-blocking-updates';

export const requestPermission = async (firestore: Firestore, userId: string): Promise<string | null> => {
  try {
    const app = getApp();
    const messaging = await isSupported() ? getMessaging(app) : null;
    if (!messaging) {
      console.log('Firebase Messaging is not supported in this browser.');
      return null;
    }
    
    console.log('Requesting permission...');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      const currentToken = await getToken(messaging, {
        vapidKey: 'BM_xqZMh6RwDGXDr5L3AwT_A-T6qXRnAKpAy-EZGndn7TgrAIbUiUxUvbCJrnMeCb2FzC9hLic6-SjpsBpFNl3o'
      });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Send this token to your server to store it
        const userDocRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userDocRef, {
            fcmTokens: arrayUnion(currentToken)
        });
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
      return currentToken;
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while getting the token:', error);
    return null;
  }
};
