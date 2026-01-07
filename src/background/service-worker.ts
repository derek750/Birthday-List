// Listen for auth messages from the auth page
chrome.runtime.onMessageExternal.addListener((message: any, sender: any, sendResponse: any) => {
  console.log('Received external message:', message);

  if (message.type === 'AUTH_SUCCESS') {
    console.log('Auth success, storing full auth data');

    // Store ALL auth data so we can reconstruct the session
    chrome.storage.local.set({
      firebaseAuth: {
        uid: message.authData.uid,
        email: message.authData.email,
        displayName: message.authData.displayName,
        photoURL: message.authData.photoURL,
        accessToken: message.authData.accessToken,
        idToken: message.authData.idToken,
        timestamp: Date.now()
      }
    }, () => {
      console.log('Firebase auth data stored');
      sendResponse({ success: true });
    });

    return true;
  }
});
