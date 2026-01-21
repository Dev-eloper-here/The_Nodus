
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDV4m1czMZcuYVZbnQ1ICynO5kCIVw91JE",
    authDomain: "nodus-ba1f0.firebaseapp.com",
    projectId: "nodus-ba1f0",
    storageBucket: "nodus-ba1f0.firebasestorage.app",
    messagingSenderId: "46971823496",
    appId: "1:46971823496:web:81f2ee5e2588c0f372063d",
    measurementId: "G-99X17L1M83"
};

// Initialize Firebase
// Check if firebase app is already initialized to avoid errors during hot-reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
