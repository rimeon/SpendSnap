/**
 * src/context/AuthContext.jsx — Global Authentication State
 *
 * Provides user auth state (user, loading) and auth actions (login, register, logout)
 * to any component in the tree via useContext(AuthContext).
 *
 * Security Upgrade: JWT token is stored as a secure, httpOnly cookie.
 * On app load, session is restored by making a secure GET /auth/me request.
 */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

// ─── Provider Component ───────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking backend session

  // Restore session from httpOnly cookie on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.data);
        }
      } catch (err) {
        // Not authorized or invalid/expired session cookie
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  /**
   * Log in an existing user.
   * Backend sets the httpOnly cookie automatically.
   */
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      setUser(data.data);
    }
    return data;
  }, []);

  /**
   * Register a new user.
   * Backend sets the httpOnly cookie automatically.
   */
  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.success) {
      setUser(data.data);
    }
    return data;
  }, []);

  /**
   * Log out: request backend to clear cookie, then reset local user state.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Update active user state in memory.
   */
  const updateUser = useCallback((userData) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...userData };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
