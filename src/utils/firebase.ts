import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithCredential,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    type User
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
} from 'firebase/firestore';
import type { Birthday, CreateBirthdayDto } from '../types/birthday';

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL so it works across extension pages
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Failed to set persistence:', error);
});

// Initialize and check for stored auth
(async () => {
    const result = await chrome.storage.local.get(['firebaseAuth']);
    if (result.firebaseAuth && !auth.currentUser) {

        console.log("Recreaing auth session")

        try {
            const { accessToken, idToken } = result.firebaseAuth;
        
            // Create credential from the stored tokens
            const credential = GoogleAuthProvider.credential(idToken, accessToken);
            
            // Sign in with the credential        
            await signInWithCredential(auth, credential);
            console.log('Signed into Firebase');

        } catch (error) {
            console.error('Failed to sign into Firebase:', error);
        }
    }
})();

const db = getFirestore(app);

// Sign out
export const signOut = async (): Promise<void> => {
    // Revoke Chrome identity token
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (token) {
                chrome.identity.removeCachedAuthToken({ token }, async () => {
                    try {
                        await firebaseSignOut(auth);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            } else {
                firebaseSignOut(auth).then(resolve).catch(reject);
            }
        });
    });
};

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Get user's birthdays collection reference
const getBirthdaysCollection = (userId: string) => {
    return collection(db, 'users', userId, 'birthdays');
};

// Create birthday
export const createBirthday = async (data: CreateBirthdayDto): Promise<Birthday> => {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const birthdaysRef = getBirthdaysCollection(user.uid);
    const now = new Date().toISOString();

    const docRef = await addDoc(birthdaysRef, {
        name: data.name,
        date: data.date,
        notes: data.notes || '',
        reminderDays: data.reminderDays || 7,
        createdAt: now,
        updatedAt: now,
    });

    return {
        id: docRef.id,
        name: data.name,
        date: data.date,
        notes: data.notes,
        reminderDays: data.reminderDays || 7,
        createdAt: now,
        updatedAt: now,
    };
};

// Get all birthdays
export const getBirthdays = async (): Promise<Birthday[]> => {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const birthdaysRef = getBirthdaysCollection(user.uid);
    const q = query(birthdaysRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Birthday));
};

// Update birthday
export const updateBirthday = async (id: string, data: Partial<Birthday>): Promise<void> => {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const birthdayRef = doc(db, 'users', user.uid, 'birthdays', id);
    await updateDoc(birthdayRef, {
        ...data,
        updatedAt: new Date().toISOString(),
    });
};

// Delete birthday
export const deleteBirthday = async (id: string): Promise<void> => {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const birthdayRef = doc(db, 'users', user.uid, 'birthdays', id);
    await deleteDoc(birthdayRef);
};