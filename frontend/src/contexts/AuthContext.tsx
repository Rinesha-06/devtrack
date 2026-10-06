import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  isProjectManager: boolean;
  isDeveloper: boolean;
  isTester: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('devtrack_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('devtrack_token');
      if (savedToken) {
        try {
          const res = await api.auth.me();
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res.data.success) {
      localStorage.setItem('devtrack_token', res.data.token);
      localStorage.setItem('devtrack_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const res = await api.auth.register({ name, email, password, role });
    if (res.data.success) {
      localStorage.setItem('devtrack_token', res.data.token);
      localStorage.setItem('devtrack_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('devtrack_token');
    localStorage.removeItem('devtrack_user');
    setToken(null);
    setUser(null);
  };

  // Instant demo switcher for academic presentations
  const switchDemoRole = async (role: UserRole) => {
    let email = 'pm@devtrack.io';
    if (role === 'DEVELOPER') email = 'dev@devtrack.io';
    if (role === 'TESTER') email = 'tester@devtrack.io';
    await login(email, 'password123');
  };

  const isProjectManager = user?.role === 'PROJECT_MANAGER';
  const isDeveloper = user?.role === 'DEVELOPER';
  const isTester = user?.role === 'TESTER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        isProjectManager,
        isDeveloper,
        isTester
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
