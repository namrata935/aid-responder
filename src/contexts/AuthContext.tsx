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
  console.log('💧 Hydrating user:', id);
  
  // 🔥 TEMPORARY: Set user immediately without querying DB
  setUser({
    id,
    email,
    role: null, // They'll select role on next page
  });
  
  console.log('✅ User state set (without DB query)');
  
  // Optional: Try to fetch role in background but don't wait
  supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', id)
    .maybeSingle()
    .then(({ data, error }) => {
      console.log('💧 Background role fetch:', { data, error });
      if (data?.role) {
        setUser({ id, email, role: data.role });
      }
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


  

  
 // 🆕 SIGNUP (with manual user_roles creation)
const signup = async (email: string, password: string) => {
  console.log('🔵 Starting signup...');
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  console.log('🔵 Signup response:', { 
    user: data.user?.id, 
    session: !!data.session,
    error: error 
  });

  if (error) throw error;

  if (data.user && data.session) {
    console.log('✅ User created and logged in:', data.user.id);
    
    // 🔥 MANUALLY create user_roles entry
    console.log('🔵 Creating user_roles entry...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role: null });
    
    if (roleError && roleError.code !== '23505') {
      console.error('⚠️ Could not create user_roles entry:', roleError);
    } else {
      console.log('✅ user_roles entry created');
    }
    
    await hydrateUser(data.user.id, data.user.email!);
    console.log('✅ User hydrated');
  }

  return data.user;
};

const selectRole = async (role: UserRole) => {
  if (!user) throw new Error('No user logged in');

  console.log('🎭 Selecting role:', role, 'for user:', user.id);

  // ✅ 1. INSERT OR UPDATE user_roles
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert(
      {
        user_id: user.id,
        role,
      },
      {
        onConflict: 'user_id',
      }
    );

  if (roleError) {
    console.error('❌ user_roles upsert failed:', roleError);
    throw roleError;
  }

  console.log('✅ user_roles row ensured');

  // ✅ 2. Create role-specific entry (safe insert)
  if (role === 'Victim') {
    const { error } = await supabase
      .from('victims')
      .insert({ id: user.id });

    if (error && error.code !== '23505') throw error;
  }

  if (role === 'Volunteer') {
    const { error } = await supabase
      .from('volunteers')
      .insert({ id: user.id });

    if (error && error.code !== '23505') throw error;
  }

  if (role === 'Manager') {
    const { error } = await supabase
      .from('managers')
      .insert({ id: user.id });

    if (error && error.code !== '23505') throw error;
  }

  // ✅ 3. Update local state
  setUser({ ...user, role });
  console.log('✅ Local state updated');
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
