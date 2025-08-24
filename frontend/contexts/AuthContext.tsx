/**
 * @file AuthContext.tsx
 * @description Authentication context provider for managing global auth state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * Initialize authentication state on mount
   */
  const initializeAuth = useCallback(() => {
    setIsAuthLoading(true);
    
    const storedToken = authService.getToken();
    const authenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    
    setToken(storedToken);
    setIsAuthenticated(authenticated);
    setUser(currentUser);
    setIsAuthLoading(false);
  }, []);

  /**
   * Refresh authentication state (useful after token changes)
   */
  const refreshAuthState = useCallback(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Login function
   */
  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    
    if (result.success && result.data) {
      setIsAuthenticated(true);
      setUser(result.data.user);
      setToken(result.data.token);
    }
    
    return result;
  }, []);

  /**
   * Register function
   */
  const register = useCallback(async (username: string, email: string, password: string) => {
    const result = await authService.register({ username, email, password });
    
    if (result.success && result.data) {
      setIsAuthenticated(true);
      setUser(result.data.user);
      setToken(result.data.token);
    }
    
    return result;
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    isAuthLoading,
    user,
    token,
    login,
    register,
    logout,
    refreshAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;