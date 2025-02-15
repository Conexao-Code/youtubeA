import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCg33LvJD5lRAXY6v-U3lnO5etFPDv0U7g",
    authDomain: "tubeanal.firebaseapp.com",
    projectId: "tubeanal",
    storageBucket: "tubeanal.firebasestorage.app",
    messagingSenderId: "665009306471",
    appId: "1:665009306471:web:a135909b43b71eaac74dc2",
    measurementId: "G-RV4P8WY7DX"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);