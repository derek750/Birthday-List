import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../utils/firebase';
import type { ReactNode } from 'react';
import type { user } from '../types/user';

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
        const unsubscribe = onAuthChange((firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email ?? '',
                    displayName: firebaseUser.displayName ?? '',
                    photoURL: firebaseUser.photoURL ?? ''
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
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