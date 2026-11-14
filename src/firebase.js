import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWwPyeRzyixy_DbGjj0qycZwOOu33D2FI",
  authDomain: "vimalvyapar.firebaseapp.com",
  projectId: "vimalvyapar",
  storageBucket: "vimalvyapar.firebasestorage.app",
  messagingSenderId: "985989323357",
  appId: "1:985989323357:web:0e911c07f10672f36dcbb4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);