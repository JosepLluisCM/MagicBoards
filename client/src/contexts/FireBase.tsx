// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
//import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_AUTH_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_AUTHDOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_AUTH_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_AUTH_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_AUTH_MESSAGINGSENDERID,
  appId: import.meta.env.VITE_FIREBASE_AUTH_APPID,
  measurementId: import.meta.env.VITE_FIREBASE_AUTH_MEASUREMENTID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
//const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider };
