import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('mess_token') || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mess_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Validate session in background on mount if token exists
  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem('mess_token');
      if (savedToken && !user) {
        try {
          setLoading(true);
          const profile = await authAPI.getMe();
          setUser(profile);
          localStorage.setItem('mess_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err);
          logout();
        } finally {
          setLoading(false);
        }
      }
    }
    verifySession();
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('mess_token', data.access_token);
    localStorage.setItem('mess_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    localStorage.setItem('mess_token', data.access_token);
    localStorage.setItem('mess_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('mess_token');
    localStorage.removeItem('mess_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
