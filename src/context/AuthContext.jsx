import React, { createContext, useContext, useState, useEffect } from 'react';
import { localDb, seedDexie } from '../db/dexieDb';
import { initSyncScheduler } from '../db/syncEngine';
import { supabase } from '../lib/supabase';

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

      // Listen for Supabase session changes
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Resolve profile role if available
        const userMetaData = session.user.user_metadata || {};
        setUser({
          email: session.user.email,
          name: userMetaData.name || session.user.email.split('@')[0],
          role: userMetaData.role || 'Admin',
          token: session.access_token
        });
      } else {
        const storedUser = localStorage.getItem('sams_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const userMetaData = session.user.user_metadata || {};
        const profile = {
          email: session.user.email,
          name: userMetaData.name || session.user.email.split('@')[0],
          role: userMetaData.role || 'Admin',
          token: session.access_token
        };
        setUser(profile);
        localStorage.setItem('sams_user', JSON.stringify(profile));
      } else {
        setUser(null);
        localStorage.removeItem('sams_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Fallback to local user simulation logic if supabase server is unconfigured / offline
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
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
