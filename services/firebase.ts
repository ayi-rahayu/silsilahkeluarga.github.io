import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZXhuQG49Du1RV_VXKFMQBJQUgCU-Rmg0",
  authDomain: "sisilahkeluarga-8aaaa.firebaseapp.com",
  projectId: "sisilahkeluarga-8aaaa",
  storageBucket: "sisilahkeluarga-8aaaa.firebasestorage.app",
  messagingSenderId: "692560168198",
  appId: "1:692560168198:web:86d78780c62fb258bf4a87",
  measurementId: "G-46TQVPH6E9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
