// This file should be in the public folder.

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// This is the same config from your src/firebase/config.ts
const firebaseConfig = {
  apiKey: "AIzaSyB8ADt_BHfhhcIwDax82s13GVYJAefjA0g",
  authDomain: "studio-6505166944-ae18f.firebaseapp.com",
  projectId: "studio-6505166944-ae18f",
  storageBucket: "studio-6505166944-ae18f.appspot.com",
  messagingSenderId: "954303139735",
  appId: "1:954303139735:web:1cb50131d512627c9d3ed2",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Make sure you have this icon in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
