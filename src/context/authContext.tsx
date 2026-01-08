import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../utils/firebase';
import type { ReactNode } from 'react';
import type { user } from '../types/user';
import type { FirebaseAuthResult } from '../types/firebaseAuth';

interface AuthContextType {
    user: user | null;
    loading: boolean;
    signOutUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOutUser: () => { },
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
    const [user, setUser] = useState<user | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const firebaseListener = onAuthChange((firebaseUser) => {
            if (firebaseUser) {
                chrome.storage.local.get(['firebaseAuth'], (result: any) => {
                    const data: FirebaseAuthResult | null = result.firebaseAuth as FirebaseAuthResult;
                    if (data) {
                        // create user
                        const userInfo: user = {
                            uid: data.uid,
                            email: data.email,
                            displayName: data.displayName,
                            photoURL: data.photoURL
                        }
                        setUser(userInfo as user);
                        
                    }
                    setLoading(false);
                });
            }
            else{
                setLoading(false);
            }
        })
        return () => {
            firebaseListener();
        };
    }, []);

    const signOutUser = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOutUser }}>
            {children}
        </AuthContext.Provider>
    );
};