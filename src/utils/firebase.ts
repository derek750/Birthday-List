import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  indexedDBLocalPersistence,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth/web-extension';
import type { Birthday, CreateBirthdayDto } from '../types/birthday';
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

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDSblynGA2nUb-IFsb10jeeGD5lhoj0oN4",
  authDomain: "birthday-list-487021.firebaseapp.com",
  projectId: "birthday-list-487021",
  storageBucket: "birthday-list-487021.firebasestorage.app",
  messagingSenderId: "985933850630",
  appId: "1:985933850630:web:fe26b79e74b057eaccfb87"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, indexedDBLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

async function getChromeIdentityAccessToken(options: { interactive: boolean }): Promise<{ token: string | null; error: string | null }> {
  return new Promise<{ token: string | null; error: string | null }>((resolve) => {
    chrome.identity.getAuthToken({ interactive: options.interactive }, (token) => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message || 'Unknown error';
        console.error('Chrome identity error:', error);
        resolve({ token: null, error });
      } else if (token) {
        resolve({ token, error: null });
      } else {
        resolve({ token: null, error: 'No token received from chrome.identity.getAuthToken' });
      }
    });
  });
}

async function signInToFirebaseWithGoogleAccessToken(accessToken: string): Promise<void> {
  const credential = GoogleAuthProvider.credential(null, accessToken);
  await signInWithCredential(auth, credential);
}

// Best-effort silent restore on extension startup (no UI prompt)
(async () => {
  if (auth.currentUser) return;
  const { token, error } = await getChromeIdentityAccessToken({ interactive: false });
  if (!token) {
    if (error) console.log('Silent sign-in skipped:', error);
    return;
  }
  try {
    await signInToFirebaseWithGoogleAccessToken(token);
  } catch (error) {
    console.error('Silent Firebase sign-in failed:', error);
  }
})();

export const onAuthChange = (cb: (user: User | null) => void) => {
  return onAuthStateChanged(auth, cb);
};

export const getCurrentUser = (): User | null => auth.currentUser;

export const signInWithGoogle = async (): Promise<void> => {
  const { token, error } = await getChromeIdentityAccessToken({ interactive: true });
  if (!token) {
    if (error?.includes('canceled') || error?.includes('user_cancel')) {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    throw new Error(error || 'Google sign-in failed. Please check your OAuth configuration.');
  }
  try {
    await signInToFirebaseWithGoogleAccessToken(token);
  } catch (firebaseError: any) {
    console.error('Firebase sign-in error:', firebaseError);
    throw new Error(firebaseError?.message || 'Failed to sign in with Firebase. Please try again.');
  }
};

export const signOut = async (): Promise<void> => {
  const { token } = await getChromeIdentityAccessToken({ interactive: false });
  if (token) {
    await new Promise<void>((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => resolve());
    });
  }
  await firebaseSignOut(auth);
};

// --- Firestore ---

function getBirthdaysCollection(userId: string): CollectionReference {
  return collection(db, 'users', userId, 'birthdays');
}

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
    ...data,
    reminderDays: data.reminderDays || 7,
    createdAt: now,
    updatedAt: now,
  };
};

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

export const updateBirthday = async (id: string, data: Partial<Birthday>) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const birthdayRef = doc(db, 'users', user.uid, 'birthdays', id);
  await updateDoc(birthdayRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteBirthday = async (id: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const birthdayRef = doc(db, 'users', user.uid, 'birthdays', id);
  await deleteDoc(birthdayRef);
};