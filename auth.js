// auth.js — Club Akenno authentication module
// Handles Firebase init, login, and signup logic.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC5RIt66tqj_E7Xj_1UarhaIcGWezIVVVY",
    authDomain: "club-akenno.firebaseapp.com",
    projectId: "club-akenno",
    storageBucket: "club-akenno.firebasestorage.app",
    messagingSenderId: "515392757059",
    appId: "1:515392757059:web:5185d8c5173aa0a4b6e3f6",
    measurementId: "G-9RWL6RHRJN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// "Remember me" — keeps the session in the browser's local storage so the
// user stays logged in across page loads, tabs, and browser restarts,
// instead of only for the current tab (browserSessionPersistence) or not
// at all (inMemoryPersistence). This is Firebase's default on web anyway,
// but setting it explicitly makes the intent clear and protects against it
// ever being changed accidentally.
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Persistence setup error:", err);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Logged in as:", user.displayName || user.email);
    }
});

/**
 * Handles the login form submission.
 * Accepts either a username or an email in the "usernameOrEmail" field.
 */
export async function handleLogin(event) {
    event.preventDefault();
    const userInput = document.forms["loginForm"]["usernameOrEmail"].value.trim();
    const pass = document.forms["loginForm"]["password"].value.trim();

    let targetEmail = userInput;

    try {
        if (!userInput.includes("@")) {
            const usernameRef = doc(db, "usernames", userInput.toLowerCase());
            const usernameSnap = await getDoc(usernameRef);

            if (!usernameSnap.exists()) {
                throw new Error("Username not found.");
            }
            targetEmail = usernameSnap.data().email;
        }

        const userCredential = await signInWithEmailAndPassword(auth, targetEmail, pass);
        const displayName = userCredential.user.displayName || userCredential.user.email;
        alert("ACCESS GRANTED: Welcome back, " + displayName + "!");
        window.location.href = "home_logged_in.html";
    } catch (err) {
        alert("ACCESS DENIED: " + err.message);
    }
}

/**
 * Handles the signup form submission.
 * Creates a Firebase Auth account, then reserves the chosen username
 * in the "usernames" collection (mapping username -> email/uid).
 */
export async function handleRegister(event) {
    event.preventDefault();
    const username = document.forms["registerForm"]["regUsername"].value.trim();
    const email = document.forms["registerForm"]["regEmail"].value.trim();
    const pass = document.forms["registerForm"]["regPassword"].value.trim();

    const usernameKey = username.toLowerCase();
    const usernameRef = doc(db, "usernames", usernameKey);

    try {
        // 1. Create the Auth account first (authenticates the user)
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

        // 2. Check if username document exists in Firestore
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
            throw new Error("That username is already taken!");
        }

        // 3. Update auth display name & save mapping
        await updateProfile(userCredential.user, { displayName: username });
        await setDoc(usernameRef, {
            email: email,
            uid: userCredential.user.uid
        });

        alert("ACCOUNT CREATED: Welcome to the club, " + username + "!");
        window.location.href = "home_logged_in.html";
    } catch (err) {
        alert("SIGNUP ERROR: " + err.message);
    }
}

/**
 * Signs the current user out and redirects to the public homepage.
 */
export async function handleLogout() {
    try {
        await signOut(auth);
        alert("YOU HAVE LOGGED OUT SUCCESSFULLY.");
        window.location.href = "index.html";
    } catch (err) {
        alert("LOGOUT ERROR: " + err.message);
    }
}

/**
 * Escapes a string for safe insertion into innerHTML. Use this any time
 * user-controlled text (display name, email, etc.) is rendered as HTML,
 * since a display name is set by the user and shouldn't be trusted as-is.
 */
export function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

export { app, auth, db };