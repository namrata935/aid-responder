import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('floodRelief_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existingUser = localStorage.getItem(`user_${email}`);
    if (existingUser) {
      const userData = JSON.parse(existingUser);
      setUser(userData);
      localStorage.setItem('floodRelief_user', JSON.stringify(userData));
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const signup = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      role: null,
      createdAt: new Date(),
    };
    
    localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
    localStorage.setItem('floodRelief_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('floodRelief_user');
  };

  const selectRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('floodRelief_user', JSON.stringify(updatedUser));
      localStorage.setItem(`user_${user.email}`, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      selectRole,
    }}>
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
