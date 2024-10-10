import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Import Firebase auth

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBphy88VbdH-cS4LJOmlMc3wggzRLcMxmE",
  authDomain: "vouchee-504da.firebaseapp.com",
  projectId: "vouchee-504da",
  storageBucket: "vouchee-504da.appspot.com",
  messagingSenderId: "815714525839",
  appId: "1:815714525839:web:46cea23508ef17ddef86fa"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // For loading state

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setUser(user); // Update user state
      setLoading(false); // Set loading to false
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(async (result) => {
        const token = await result.user.getIdToken();
        console.log(token); // Send this token to your backend
        setUser(result.user); // Set the logged-in user
      })
      .catch((error) => {
        console.error('Login failed:', error);
      });
  };

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      setUser(null); // Clear user state on logout
      console.log("User logged out successfully.");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Show loading state
  }

  return (
    <div className="App">
      <h1>Firebase Google OAuth</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.displayName}</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login with Google</button>
      )}
    </div>
  );
}

export default App;