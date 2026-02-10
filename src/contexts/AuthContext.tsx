import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'employee' | 'founder';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isFounder: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (id: string, email: string) => {
    console.log('Fetching profile for:', email);

    // Create a fallback profile
    const fallbackProfile = {
      id,
      name: email.split('@')[0],
      email: email,
      role: 'employee' as UserRole,
      department: 'General',
    };

    try {
      // Use a Promise.race to timeout the fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.warn('Profile fetch error, using fallback:', error.message);
        return fallbackProfile;
      }

      console.log('Profile found in database');
      return {
        id: data.id,
        name: data.name || email.split('@')[0],
        email: data.email,
        role: data.role as UserRole,
        avatar: data.avatar_url,
        department: data.department || 'General',
      };
    } catch (err: any) {
      console.warn('Profile fetch failed or timed out, using fallback:', err.message || err);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    // Safety timeout to ensure app doesn't stay white forever
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timed out, proceeding to render...');
        setLoading(false);
      }
    }, 5000);

    console.log('Initializing Auth Context...');

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session check complete:', session ? 'User logged in' : 'No session');
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!).then(profile => {
          console.log('Profile fetch complete');
          setUser(profile);
          setLoading(false);
          clearTimeout(timer);
        });
      } else {
        setLoading(false);
        clearTimeout(timer);
      }
    }).catch(err => {
      console.error('Error getting session:', err);
      setLoading(false);
      clearTimeout(timer);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email!);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'employee'): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role,
          }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin' || user?.role === 'founder',
        isFounder: user?.role === 'founder',
        login,
        signUp,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
