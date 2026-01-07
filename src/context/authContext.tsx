import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, getCurrentUser } from '../utils/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect started');
    
    // First, check if we have a stored user from Chrome storage
    chrome.storage.local.get(['user'], (result : any) => {
      console.log('Chrome storage result:', result);
      
      if (result.user) {
        console.log('Found stored user:', result.user);
        // Create a mock User object from stored data
        setUser(result.user as User);
      }
      // Always set loading to false after checking storage
      setLoading(false);
    });

    console.log(getCurrentUser());

    // Then listen for Firebase auth changes
    const unsubscribe = onAuthChange((firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Store in Chrome storage too
        chrome.storage.local.set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }
        });
      } else {
        // Only clear user if we don't have one in storage
        chrome.storage.local.get(['user'], (result : any) => {
          if (!result.user) {
            setUser(null);
          }
        });
      }
      setLoading(false);
    });

    // Listen for Chrome storage changes (when auth tab signs in)
    const storageListener = (changes: any, areaName: string) => {
      console.log('Storage changed:', changes, areaName);
      if (areaName === 'local' && changes.user) {
        console.log('User changed in storage:', changes.user.newValue);
        if (changes.user.newValue) {
          setUser(changes.user.newValue as User);
        } else {
          setUser(null);
        }
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      console.log('AuthProvider cleanup');
      unsubscribe();
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  // console.log('AuthProvider render - user:', user, 'loading:', loading);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};