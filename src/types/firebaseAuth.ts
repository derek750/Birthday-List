export interface FirebaseAuthResult {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    accessToken: string;
    idToken: string;
    googleToken: string;
    timestamp: number;
}