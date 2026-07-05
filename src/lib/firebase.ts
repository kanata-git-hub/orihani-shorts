import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCtEbU2W0VZdxN45JVOdYtaxwe5tSg2bjY",
  authDomain: "gen-lang-client-0165298283.firebaseapp.com",
  projectId: "gen-lang-client-0165298283",
  storageBucket: "gen-lang-client-0165298283.firebasestorage.app",
  messagingSenderId: "610824131458",
  appId: "1:610824131458:web:4fbc61e7216a4af4e0b59b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-f376a0b6-5958-49f8-a6f5-7097ff44e246");
export const auth = getAuth(app);
