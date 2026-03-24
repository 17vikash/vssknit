// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXCzaJOtQGPG124o1dNNu8YxLge7OVc6U",
  authDomain: "vssknitfinishers.firebaseapp.com",
  projectId: "vssknitfinishers",
  storageBucket: "vssknitfinishers.firebasestorage.app",
  messagingSenderId: "474803873031",
  appId: "1:474803873031:web:ad226c824b742e0ebed1a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Firestore Collections
const receivedCol = collection(db, "recieved");
const deliveriesCol = collection(db, "delivery");
const partiesCol = collection(db, "party_master");
const dyeingCol = collection(db, "dyeing_master");
const usersCol = collection(db, "users");
const staffCol = collection(db, "staff");
const attendanceCol = collection(db, "attendance");
const invoicesCol = collection(db, "invoices");

// Expose globally for regular scripts
window.firebaseApp = app;
window.db = db;
window.auth = auth;
window.receivedCol = receivedCol;
window.deliveriesCol = deliveriesCol;
window.partiesCol = partiesCol;
window.dyeingCol = dyeingCol;
window.usersCol = usersCol;
window.staffCol = staffCol;
window.attendanceCol = attendanceCol;
window.invoicesCol = invoicesCol;
const settingsCol = collection(db, "settings");
window.settingsCol = settingsCol;
const countersCol = collection(db, "counters");
window.countersCol = countersCol;

// Firestore Functions
window.getDocs = getDocs;
window.addDoc = addDoc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.doc = doc;
window.query = query;
window.where = where;
window.orderBy = orderBy;

console.log("Firebase initialized successfully with collection references");

export { app, db, auth, receivedCol, deliveriesCol, partiesCol, dyeingCol, usersCol, staffCol, attendanceCol, invoicesCol, settingsCol, countersCol, getDocs, addDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy };
