import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { User, UserRole } from '../types';
import { db } from '../db/database';
import { seedDatabaseIfEmpty } from '../db/seed';
import {
  auth,
  googleProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from '../firebase/config';
import { recordUserLoginToFirebase } from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role: UserRole, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (fullName: string, email: string, password: string, role: UserRole, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        await seedDatabaseIfEmpty();
        
        onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const userEmail = fbUser.email || 'admin@finpulse.in';
            const userName = fbUser.displayName || userEmail.split('@')[0];
            const userPhoto = fbUser.photoURL || '';

            let found = await db.users.where('email').equalsIgnoreCase(userEmail).first();

            if (!found) {
              const newUser: User = {
                id: fbUser.uid,
                name: userName,
                email: userEmail,
                role: 'Admin',
                avatar: userPhoto,
                phone: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
              };
              await db.users.add(newUser);
              found = newUser;
            }
            setUser(found);
            localStorage.setItem('finpulse_user_id', found.id);
          } else {
            // Check local vs session persistence storage
            const savedUserId = localStorage.getItem('finpulse_user_id') || sessionStorage.getItem('finpulse_user_id');
            if (savedUserId) {
              const foundUser = await db.users.get(savedUserId);
              if (foundUser) setUser(foundUser);
            }
          }
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Error initializing auth:', err);
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const saveSessionStorage = (userId: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem('finpulse_user_id', userId);
      localStorage.setItem('finpulse_remember_me', 'true');
      sessionStorage.removeItem('finpulse_user_id');
    } else {
      sessionStorage.setItem('finpulse_user_id', userId);
      localStorage.removeItem('finpulse_user_id');
      localStorage.removeItem('finpulse_remember_me');
    }
  };

  // Sign Up New Account
  const signUp = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole = 'Admin',
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (e) {
        console.warn('Persistence setup note:', e);
      }

      let fbUser: any = null;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        fbUser = cred.user;
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: fullName });
        }
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            fbUser = cred.user;
          } catch (signInErr: any) {
            setIsLoading(false);
            return { success: false, error: 'Account already exists. Please Sign In with your password.' };
          }
        } else if (fbErr.code === 'auth/weak-password') {
          setIsLoading(false);
          return { success: false, error: 'Password must be at least 6 characters long.' };
        }
      }

      const userId = fbUser?.uid || `USR-${Date.now()}`;
      let found = await db.users.where('email').equalsIgnoreCase(email).first();

      if (!found) {
        const newUser: User = {
          id: userId,
          name: fullName,
          email,
          role,
          avatar: '',
          phone: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await db.users.add(newUser);
        found = newUser;
      } else {
        await db.users.update(found.id, { name: fullName, lastLogin: new Date().toISOString() });
        found = { ...found, name: fullName };
      }

      setUser(found);
      saveSessionStorage(found.id, rememberMe);
      await recordUserLoginToFirebase(found);

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('SignUp Error:', err);
      setIsLoading(false);
      return { success: false, error: err.message || 'Could not create account.' };
    }
  };

  // Sign In Existing Account
  const login = async (
    email: string,
    role: UserRole = 'Admin',
    password = 'password123',
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (e) {
        console.warn('Persistence setup note:', e);
      }

      let fbUser: any = null;

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        fbUser = cred.user;
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            fbUser = cred.user;
          } catch (createErr) {
            console.warn('Auto registration fallback notice:', createErr);
          }
        }
      }

      const userId = fbUser?.uid || `USR-${Date.now()}`;
      let found = await db.users.where('email').equalsIgnoreCase(email).first();

      if (!found) {
        const newUser: User = {
          id: userId,
          name: email.split('@')[0],
          email,
          role,
          avatar: '',
          phone: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await db.users.add(newUser);
        found = newUser;
      } else {
        await db.users.update(found.id, { lastLogin: new Date().toISOString() });
      }

      setUser(found);
      saveSessionStorage(found.id, rememberMe);
      await recordUserLoginToFirebase(found);

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  // Google Sign In
  const loginWithGoogle = async (rememberMe = true): Promise<boolean> => {
    setIsLoading(true);
    try {
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (e) {}

      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const userEmail = fbUser.email || 'admin@finflow.in';
      const userName = fbUser.displayName || userEmail.split('@')[0];
      const userPhoto = fbUser.photoURL || '';

      let found = await db.users.where('email').equalsIgnoreCase(userEmail).first();

      if (!found) {
        const newUser: User = {
          id: fbUser.uid,
          name: userName,
          email: userEmail,
          role: 'Admin',
          avatar: userPhoto,
          phone: fbUser.phoneNumber || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await db.users.add(newUser);
        found = newUser;
      } else {
        await db.users.update(found.id, {
          name: userName,
          avatar: userPhoto,
          lastLogin: new Date().toISOString()
        });
        found = { ...found, name: userName, avatar: userPhoto };
      }

      setUser(found);
      saveSessionStorage(found.id, rememberMe);
      await recordUserLoginToFirebase(found);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Google Popup Sign-In Error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('SignOut error:', e);
    }
    setUser(null);
    localStorage.removeItem('finpulse_user_id');
    localStorage.removeItem('finpulse_remember_me');
    sessionStorage.removeItem('finpulse_user_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signUp,
        loginWithGoogle,
        logout,
        isAdmin: user?.role === 'Admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
