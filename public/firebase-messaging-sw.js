importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBphy88VbdH-cS4LJOmlMc3wggzRLcMxmE",
  authDomain: "vouchee-504da.firebaseapp.com",
  projectId: "vouchee-504da",
  storageBucket: "vouchee-504da.appspot.com",
  messagingSenderId: "815714525839",
  appId: "1:815714525839:web:46cea23508ef17ddef86fa",
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: icon || '/default-icon.png', // Fallback icon
  });
});
