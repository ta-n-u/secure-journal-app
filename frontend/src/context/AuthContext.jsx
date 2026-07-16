import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { deriveKey, exportKey, importKey } from '../utils/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem('email') || null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [ready, setReady] = useState(false); // avoids a flash of "logged out" while restoring

  const clearSession = () => {
    sessionStorage.removeItem('encKey');
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('encryptionSalt');
    setEmail(null);
    setEncryptionKey(null);
  };

  const persistKey = async (key, userEmail) => {
    const exported = await exportKey(key);
    // Kept in sessionStorage (not localStorage) so it's at least wiped when
    // the browser tab/window is closed, rather than surviving forever.
    sessionStorage.setItem('encKey', exported);
    setEmail(userEmail);
    setEncryptionKey(key);
  };

  // On mount, restore the key from sessionStorage if present -- this is
  // what lets a page refresh stay logged in without re-entering the password.
  useEffect(() => {
    (async () => {
      const stored = sessionStorage.getItem('encKey');
      if (stored) {
        try {
          const key = await importKey(stored);
          setEncryptionKey(key);
        } catch {
          clearSession();
        }
      }
      setReady(true);
    })();
  }, []);

  const signup = async (email, password) => {
    const res = await api.post('/auth/signup', { email, password });
    const { token, encryptionSalt } = res.data;
    const key = await deriveKey(password, encryptionSalt);

    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('encryptionSalt', encryptionSalt);
    await persistKey(key, email);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, encryptionSalt } = res.data;
    const key = await deriveKey(password, encryptionSalt);

    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('encryptionSalt', encryptionSalt);
    await persistKey(key, email);
  };

  const logout = () => clearSession();

  const isLoggedIn = !!localStorage.getItem('token');
  const hasKey = !!encryptionKey;

  return (
    <AuthContext.Provider
      value={{ email, encryptionKey, signup, login, logout, isLoggedIn, hasKey, ready }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
