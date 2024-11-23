import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBphy88VbdH-cS4LJOmlMc3wggzRLcMxmE",
  authDomain: "vouchee-504da.firebaseapp.com",
  projectId: "vouchee-504da",
  storageBucket: "vouchee-504da.appspot.com",
  messagingSenderId: "815714525839",
  appId: "1:815714525839:web:46cea23508ef17ddef86fa",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const messaging = getMessaging(app);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceToken, setDeviceToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Register the service worker
        await navigator.serviceWorker.register('/firebase-messaging-sw.js', { type: 'module' });
        console.log("Service worker registered successfully.");
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }

      // Listen for authentication state changes
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          await requestNotificationPermission();
        }
      });

      return () => unsubscribe();
    };

    init();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const status = await Notification.requestPermission();
      if (status === "granted") {
        const token = await getToken(messaging, {
          vapidKey: "BJZMyFAgcWeivzxKag1dd-t7Gz9MSK_epFSlI8iQt20ubiys0fCPkrQchNJ9k8svzKAlThjWhfeE4nb0griHJAI",
        });

        if (token) {
          console.log("Device Token:", token);
          setDeviceToken(token);

          // Send the token to the backend for registration
          await registerDeviceToken(token);
        } else {
          console.error("No registration token available. Request permission to generate one.");
        }
      } else {
        console.error("Notification permission denied.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const registerDeviceToken = async (token) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/v1/deviceToken/create_device_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ userId: user.uid, deviceToken: token }),
      });

      if (response.ok) {
        console.log("Device token registered successfully.");
      } else {
        console.error("Failed to register device token.");
      }
    } catch (error) {
      console.error("Error registering device token:", error);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseToken = await result.user.getIdToken();

      console.log("Firebase Token:", firebaseToken);

      const apiResponse = await authenticateWithBackend(firebaseToken);
      console.log("Backend Response:", apiResponse);

      setUser({
        id: apiResponse.id,
        role: apiResponse.role,
        email: apiResponse.email,
        image: apiResponse.image,
        accessToken: apiResponse.accessToken,
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const authenticateWithBackend = async (firebaseToken) => {
    try {
      const response = await fetch(
        `https://api.vouchee.shop/api/v1/auth/login_with_google_token?token=${firebaseToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Error during authentication:", error);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <h1>Notifications App</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.displayName}</h2>
          <img src={user.photoURL} alt="User" />
          <p>Email: {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
          <ul>
            <li>Device Token: {deviceToken}</li>
            <li>Role: {user.role}</li>
          </ul>
        </div>
      ) : (
        <button onClick={handleLogin}>Login with Google</button>
      )}
    </div>
  );
}

export default App;
