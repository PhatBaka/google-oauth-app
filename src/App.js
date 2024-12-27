import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
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
  const [firebaseToken, setFirebaseToken] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          type: "module",
        });
        console.log("Service worker registered successfully.");
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }

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

  const handleLoginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      setFirebaseToken(token);

      console.log("Firebase Token:", token);

      const apiResponse = await authenticateWithBackend(token);
      console.log("Backend Response:", apiResponse);

      setUser({
        id: apiResponse.id,
        role: apiResponse.role,
        email: apiResponse.email,
        image: apiResponse.image,
        accessToken: apiResponse.accessToken,
      });
    } catch (error) {
      console.error("Google login failed:", error.message);
    }
  };

  const handleLoginWithEmail = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setFirebaseToken(token);

      console.log("Firebase Token:", token);

      const apiResponse = await authenticateWithBackend(token);
      console.log("Backend Response:", apiResponse);

      setUser({
        id: apiResponse.id,
        role: apiResponse.role,
        email: apiResponse.email,
        image: apiResponse.image,
        accessToken: apiResponse.accessToken,
      });
    } catch (error) {
      console.error("Email login failed:", error.message);
    }
  };

  const handleSignupWithEmail = async () => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signup successful:", result.user);
    } catch (error) {
      console.error("Signup failed:", error.message);
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
      setFirebaseToken(null);
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
          <h2>Welcome, {user.displayName || user.email}</h2>
          <img src={user.photoURL || ""} alt="User" />
          <p>Email: {user.email}</p>
          <p>Bearer Token: {firebaseToken}</p>
          <button onClick={handleLogout}>Logout</button>
          <ul>
            <li>Device Token: {deviceToken}</li>
            <li>Role: {user.role || "Unknown"}</li>
          </ul>
        </div>
      ) : (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLoginWithEmail}>Login with Email</button>
          <button onClick={handleSignupWithEmail}>Sign up with Email</button>
          <button onClick={handleLoginWithGoogle}>Login with Google</button>
        </div>
      )}
    </div>
  );
}

export default App;
