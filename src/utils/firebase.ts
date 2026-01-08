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
    CollectionReference,
} from 'firebase/firestore';
import type { Birthday, CreateBirthdayDto } from '../types/birthday';
import type { FirebaseAuthResult } from '../types/firebaseAuth';

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

// Initialize Firebase signin
(async () => {
    const result = await chrome.storage.local.get(['firebaseAuth']);
    const data : FirebaseAuthResult = result.firebaseAuth as FirebaseAuthResult
    if (result.firebaseAuth && !auth.currentUser) {

        console.log("Signing into firebase")

        try {
            const { googleToken } = data;

            // Create credential from the stored tokens
            const credential = GoogleAuthProvider.credential(googleToken);

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
    const result: chrome.identity.GetAuthTokenResult | undefined =
        await new Promise((resolve) => {
            chrome.identity.getAuthToken({ interactive: false }, (result) => {
                if (chrome.runtime.lastError) {
                    resolve(undefined);
                } else {
                    resolve(result);
                }
            });
        });

    const token: string | undefined = result?.token;

    if (token) {
        await new Promise<void>((resolve, reject) => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    await new Promise<void>((resolve, reject) => {
        chrome.storage.local.remove(["firebaseAuth"],() => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            }
        );
    });
    await firebaseSignOut(auth);
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
function getBirthdaysCollection(userId : string) : CollectionReference {
    const data : CollectionReference = collection(db, 'users', userId, 'birthdays');
    return data;
}

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