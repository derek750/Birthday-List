import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

console.log('Script started');

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

console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const statusDiv = document.getElementById('status');

console.log('Setting persistence...');
setPersistence(auth, browserLocalPersistence).then(() => {
    console.log('Persistence set, checking for redirect result...');

    // Check if returning from redirect
    getRedirectResult(auth)
        .then((result) => {
            console.log('Redirect result:', result);
            if (result) {
                console.log('User signed in:', result.user);
                statusDiv.innerHTML = '<div class="status success">✅ Success! User: ' + result.user.email + '</div>';
                statusDiv.innerHTML += '<div>Closing in 3 seconds...</div>';

                setTimeout(() => {
                    console.log('Closing window...');
                    window.close();
                }, 3000);
            } else {
                console.log('No redirect result - user needs to sign in');
                statusDiv.innerHTML = '<div>Ready to sign in</div>';
            }
        })
        .catch((error) => {
            console.error('Redirect error:', error);
            statusDiv.innerHTML = '<div class="status error">❌ ' + error.message + '</div>';
        });
}).catch((error) => {
    console.error('Persistence error:', error);
    statusDiv.innerHTML = '<div class="status error">❌ Persistence error: ' + error.message + '</div>';
});

// Sign in button
document.getElementById('signInBtn').addEventListener('click', async () => {
    console.log('Sign in button clicked');
    try {
        statusDiv.innerHTML = '<div class="status loading">Redirecting to Google...</div>';
        const provider = new GoogleAuthProvider();
        console.log('Calling signInWithRedirect...');
        await signInWithRedirect(auth, provider);
        console.log('signInWithRedirect called (should redirect now)');
    } catch (error) {
        console.error('Sign in error:', error);
        statusDiv.innerHTML = '<div class="status error">❌ ' + error.message + '</div>';
    }
});

// Also listen for auth state changes
auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user);
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('User is signed out');
    }
});

console.log('Script setup complete');
