import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

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

// Helper to convert Supabase user to app User
const convertSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) return null;

  // Fetch profile to get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, created_at')
    .eq('id', supabaseUser.id)
    .single();

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    role: (profile?.role as UserRole) || null,
    createdAt: profile?.created_at ? new Date(profile.created_at) : new Date(supabaseUser.created_at),
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await convertSupabaseUser(session.user);
        setUser(appUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const appUser = await convertSupabaseUser(session.user);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Invalid credentials');
    }

    if (data.user) {
      const appUser = await convertSupabaseUser(data.user);
      setUser(appUser);
    }
  };

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Failed to create account');
    }

    if (data.user) {
      // Profile is created automatically via trigger, but we can update it
      const appUser = await convertSupabaseUser(data.user);
      setUser(appUser);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const selectRole = async (role: UserRole) => {
    if (!user) return;

    // Update role in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating role:', error);
      return;
    }

    // Update local user state
    const updatedUser = { ...user, role };
    setUser(updatedUser);
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

