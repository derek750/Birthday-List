import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

console.log('Script started');

const firebaseConfig = {
    apiKey: "AIzaSyBFJ3it6yrikumdeLmpad_tDgXc8opq-EI",
    authDomain: "birthday-tracker-d8cec.firebaseapp.com",
    databaseURL: "https://birthday-tracker-d8cec-default-rtdb.firebaseio.com",
    projectId: "birthday-tracker-d8cec",
    storageBucket: "birthday-tracker-d8cec.firebasestorage.app",
    messagingSenderId: "746412138338",
    appId: "1:746412138338:web:253ae60c8164f2e599563b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const statusDiv = document.getElementById('status');

// Get extension ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const extensionId = urlParams.get('extensionId');

document.getElementById('signInBtn').addEventListener('click', async () => {
    try {
        statusDiv.innerHTML = '<div class="status loading">Opening Google sign-in...</div>';
        const provider = new GoogleAuthProvider();

        // Use popup instead of redirect
        const result = await signInWithPopup(auth, provider);

        statusDiv.innerHTML = '<div class="status success">Signed in as ' + result.user.email + '</div>';

        // Get the ID token
        const idToken = await result.user.getIdToken();

        // Get accessToken
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential.accessToken;

        // Send message to extension
        if (extensionId) {
            chrome.runtime.sendMessage(extensionId, {
                type: 'AUTH_SUCCESS',
                authData: {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    accessToken: accessToken,
                    token: idToken,
                }
            }, (response) => {
                console.log('Message sent to extension:', response);
                statusDiv.innerHTML += '<div>Closing tab...</div>';
                setTimeout(() => window.close(), 1500);
            });
        } else {
            statusDiv.innerHTML += '<div>Please reopen from extension</div>';
        }

    } catch (error) {
        console.error('Sign in error:', error);
        statusDiv.innerHTML = '<div class="status error">❌ ' + error.message + '</div>';
    }
});