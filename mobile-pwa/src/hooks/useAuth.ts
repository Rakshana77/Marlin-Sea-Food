import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User } from '../types/models';
import { fetchCurrentProfile, loginApi, logoutUser } from '../api/auth';
import { getStoredToken, setOnUnauthorized } from '../api/client';
import { LoginPayload } from '../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await fetchCurrentProfile();
      setUser(profile);
    } catch {
      // Token expired or invalid
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Register global 401 callback
    setOnUnauthorized(() => {
      logout();
    });

    restoreSession();
  }, [restoreSession, logout]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const result = await loginApi(payload);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'ADMIN';
  const isWorker = user?.role === 'WORKER';

  return {
    user,
    isAuthenticated,
    isAdmin,
    isWorker,
    isLoading,
    login,
    logout,
  };
}
