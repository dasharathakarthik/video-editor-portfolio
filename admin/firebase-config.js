// admin/firebase-config.js

// Firebase configuration for your Admin Panel project
var firebaseConfig = {
  apiKey: "AIzaSyAV-IX9hG9RxLArfBNOaNf2xv3KyKJ8cF0",
  authDomain: "admin-panel-790c9.firebaseapp.com",
  projectId: "admin-panel-790c9",
  storageBucket: "admin-panel-790c9.firebasestorage.app",
  messagingSenderId: "440697863430",
  appId: "1:440697863430:web:bceb2035075babf7df3287",
  measurementId: "G-6YP6BMX8Z5"
};

// Initialize Firebase app if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Convenience references
var auth = firebase.auth();
var db = firebase.firestore();

// -----------------------------
// Authentication helper methods
// -----------------------------

// Register a new user with email + password
function registerUser(email, password) {
  return auth.createUserWithEmailAndPassword(email, password);
}

// Log in an existing user with email + password
function loginUser(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

// Log out the current user
function logoutUser() {
  return auth.signOut();
}

// Listen for auth state changes (user login/logout)
function subscribeToAuthChanges(callback) {
  return auth.onAuthStateChanged(callback);
}
