// src/config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzqqCFtUALDQNlD93sg50BlWs6-8TbSZQ",
  authDomain: "iot---terraassist.firebaseapp.com",
  databaseURL: "https://iot---terraassist-default-rtdb.firebaseio.com",
  projectId: "iot---terraassist",
  storageBucket: "iot---terraassist.firebasestorage.app",
  messagingSenderId: "904864654739",
  appId: "1:904864654739:web:985358474d1e801ee87466",
  measurementId: "G-8GD207K570"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;
