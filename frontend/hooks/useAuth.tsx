'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = Cookies.get('token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { token: newToken, user: userData } = response.data;

      Cookies.set('token', newToken, { expires: 7 });
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true, message: 'Login successful!', user: userData };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
