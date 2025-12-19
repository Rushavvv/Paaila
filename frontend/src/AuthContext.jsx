import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from './api';

// Create context
const AuthContext = createContext();

// Hook to use auth
export function useAuth() {
  return useContext(AuthContext);
}

// Auth Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // Not logged in
      setUser(null);
    }
    setLoading(false);
  }

  async function login(username, password) {
    try {
      await api.login(username, password);
      const userData = await api.getCurrentUser();
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function register(username, email, password, fullName) {
    try {
      await api.register(username, email, password, fullName);
      await login(username, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  function logout() {
    api.logout();
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}