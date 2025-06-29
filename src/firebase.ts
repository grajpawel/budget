// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "",
  authDomain: "budget-fire-2137.firebaseapp.com",
  projectId: "budget-fire-2137",
  storageBucket: "budget-fire-2137.firebasestorage.app",
  messagingSenderId: "431835276011",
  appId: "1:431835276011:web:073a3fcbf4ec4ccb1a14ae",
  measurementId: "G-7Y99HPJD1J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
