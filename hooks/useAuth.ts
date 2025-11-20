import { useState, useEffect } from 'react';
import { auth, firestore } from '../firebase/config';
import type { User } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier, password) => {
    let email = identifier;
    // Smart login: check if identifier is a username
    if (!identifier.includes('@')) {
        const usersRef = firestore.collection('users');
        const query = usersRef.where('username_lowercase', '==', identifier.toLowerCase()).limit(1);
        const snapshot = await query.get();

        if (snapshot.empty) {
            throw new Error("Invalid username or password.");
        }
        const userData = snapshot.docs[0].data();
        email = userData.email;
    }
    return auth.signInWithEmailAndPassword(email, password);
  };
  
  const signUp = async (email, username, password) => {
    // Check if username is already taken (case-insensitive)
    const usersRef = firestore.collection('users');
    const query = usersRef.where('username_lowercase', '==', username.toLowerCase()).limit(1);
    const snapshot = await query.get();

    if (!snapshot.empty) {
        throw new Error("Username is already taken.");
    }

    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const newUser = userCredential.user;

    if (!newUser) {
        throw new Error("Failed to create user.");
    }

    // Create user profile in Firestore
    await firestore.collection('users').doc(newUser.uid).set({
        uid: newUser.uid,
        email: email,
        username: username,
        username_lowercase: username.toLowerCase(), // for case-insensitive queries
        createdAt: new Date().toISOString(),
    });

    return userCredential;
  };

  const logout = () => {
    return auth.signOut();
  };

  return { user, login, signUp, logout, loading };
};