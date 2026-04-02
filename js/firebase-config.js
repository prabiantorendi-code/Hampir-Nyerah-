// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Ganti dengan config Firebase sendiri saat deploy
const firebaseConfig = {
apiKey: "AIzaSyCnNTd6qx53kL490UUd7QWNAT_qmzsSw-Q",
authDomain: "games-top-up-b8a67.firebaseapp.com",
projectId: "games-top-up-b8a67",
storageBucket: "games-top-up-b8a67.firebasestorage.app",
messagingSenderId: "225580199940",
appId: "1:225580199940:web:e30c261f0b731721588551",
measurementId: "G-1CSZPG8361"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { 
  app, 
  auth, 
  db, 
  storage,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  ref,
  uploadBytes,
  getDownloadURL
};
