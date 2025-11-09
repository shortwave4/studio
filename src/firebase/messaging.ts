'use client';

import { getMessaging, getToken } from 'firebase/messaging';
import { getApp } from 'firebase/app';

export const requestPermission = async () => {
  const app = getApp();
  const messaging = getMessaging(app);
  
  console.log('Requesting permission...');
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    console.log('Notification permission granted.');
    
    // Get the token
    const currentToken = await getToken(messaging, {
      // The VAPID key is a public key used for authentication.
      // You need to generate this in your Firebase project settings.
      // Go to Project Settings -> Cloud Messaging -> Web configuration -> Web Push certificates
      vapidKey: BAnlivzQi-Tp7z3yoKU9z3J6MjIJKHKSzeHa1AKY_i-ykpwST7TNcI8qT4EST54-ghRuyIK1tW472iTlRrrIMPORTANTPORTANT: Replace with your actual VAPID key
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // You would typically send this token to your backend server
      // to store it and use it to send notifications to this device.
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
    return currentToken;
  } else {
    console.log('Unable to get permission to notify.');
    return null;
  }
};
