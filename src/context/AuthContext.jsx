import React, { createContext, useContext, useState, useEffect } from 'react';
import { localDb, seedDexie } from '../db/dexieDb';
import { initSyncScheduler } from '../db/syncEngine';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Seed Dexie tables
      await seedDexie();
      
      // Start connection schedulers
      initSyncScheduler();

      const storedUser = localStorage.getItem('sams_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    initApp();
  }, []);

  const login = (email, password) => {
    let matchedUser = null;

    if (email === 'admin@sams.com') {
      matchedUser = { email, name: 'Sagar Kumar', role: 'Admin', token: 'jwt-admin-token' };
    } else if (email === 'super@sams.com') {
      matchedUser = { email, name: 'Adarsh Sen (CEO)', role: 'Super Admin', token: 'jwt-superadmin-token' };
    } else if (email === 'billing@sams.com') {
      matchedUser = { email, name: 'Roshan Mathew', role: 'Billing Staff', token: 'jwt-billing-token' };
    } else if (email === 'export@sams.com') {
      matchedUser = { email, name: 'Global Marine Viewer', role: 'Export Company', token: 'jwt-export-token' };
    }

    if (matchedUser && password === 'seafood123') {
      setUser(matchedUser);
      localStorage.setItem('sams_user', JSON.stringify(matchedUser));
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Try: admin@sams.com / seafood123' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sams_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
