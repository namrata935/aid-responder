import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔁 Load session on refresh
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (sessionUser) {
        await hydrateUser(sessionUser.id, sessionUser.email!);
      }

      setIsLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await hydrateUser(session.user.id, session.user.email!);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔹 Load role from DB
  const hydrateUser = async (id: string, email: string) => {
    const { data } = await supabase
      .from('flood_management.user_roles')
      .select('role')
      .eq('user_id', id)
      .single();

    setUser({
      id,
      email,
      role: data?.role ?? null,
    });
  };

  // 🔐 LOGIN
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const sessionUser = data.user;
    if (!sessionUser) return;

    await hydrateUser(sessionUser.id, sessionUser.email!);
  };

  // 🆕 SIGNUP (🔥 FIXED)
  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) throw error;
  
    // 🔥 DO NOTHING ELSE HERE
    // No DB inserts
    // No role logic
  };
  
  // 🎭 SELECT ROLE
  const selectRole = async (role: UserRole) => {
    if (!user) return;

    const { error } = await supabase
      .from('flood_management.user_roles')
      .update({ role })
      .eq('user_id', user.id);

    if (error) throw error;

    setUser({ ...user, role });
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        selectRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
