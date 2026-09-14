import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ngo-web-a7c3e",
  appId: "1:109165857470:web:be6eb49980d3ed6c10acef",
  apiKey: "AIzaSyDpngGJfJhp3iKJ3BvqO1odNZeAYCZeDpI",
  authDomain: "ngo-web-a7c3e.firebaseapp.com",
  storageBucket: "ngo-web-a7c3e.firebasestorage.app",
  messagingSenderId: "109165857470",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-idforge-b0237242-cdab-405b-8741-a1d7fee55089");
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

