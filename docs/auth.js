import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBFJ3it6yrikumdeLmpad_tDgXc8opq-EI",
    authDomain: "birthday-tracker-d8cec.firebaseapp.com",
    databaseURL: "https://birthday-tracker-d8cec-default-rtdb.firebaseio.com",
    projectId: "birthday-tracker-d8cec",
    storageBucket: "birthday-tracker-d8cec.firebasestorage.app",
    messagingSenderId: "746412138338",
    appId: "1:746412138338:web:253ae60c8164f2e599563b",
    measurementId: "G-CNXY1KB59G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const statusDiv = document.getElementById('status');

// Set persistence FIRST
setPersistence(auth, browserLocalPersistence).then(() => {
    // Check if returning from redirect
    getRedirectResult(auth)
        .then((result) => {
            if (result) {
                statusDiv.innerHTML = '<div class="status success">✅ Success! Closing tab...</div>';
                // Close tab after 1 second
                setTimeout(() => {
                    window.close();
                }, 1000);
            }
        })
        .catch((error) => {
            statusDiv.innerHTML = '<div class="status error">❌ ' + error.message + '</div>';
        });
});

// Sign in button
document.getElementById('signInBtn').addEventListener('click', async () => {
    try {
        statusDiv.innerHTML = '<div class="status loading">Redirecting to Google...</div>';
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
    } catch (error) {
        statusDiv.innerHTML = '<div class="status error">❌ ' + error.message + '</div>';
    }
});
