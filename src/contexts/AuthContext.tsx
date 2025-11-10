import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { testDatabaseConnection } from '../utils/supabaseHealthCheck';

type Profile = Database['public']['Tables']['profiles']['Row'];

export type ProfileError = {
  type: 'network' | 'database' | 'not_found' | 'permission' | 'unknown';
  message: string;
  details?: string;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  profileError: ProfileError | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: { full_name: string; user_type?: string }) => Promise<{ error: AuthError | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  clearProfileError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<ProfileError | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string, retryCount = 0) => {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 1500;

    try {
      console.log(`[AuthContext] Loading profile for user ${userId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

      if (retryCount === 0) {
        const healthCheck = await testDatabaseConnection();
        if (!healthCheck.success) {
          console.error('[AuthContext] Database connection failed:', healthCheck.message);
          setProfileError({
            type: 'network',
            message: 'Problème de connexion à la base de données',
            details: healthCheck.message
          });
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error from Supabase:', error);

        if (error.code === 'PGRST116') {
          setProfileError({
            type: 'not_found',
            message: 'Profil introuvable',
            details: 'Votre profil n\'a pas été créé correctement. Veuillez contacter le support.'
          });
        } else if (error.message.includes('permission')) {
          setProfileError({
            type: 'permission',
            message: 'Erreur de permission',
            details: 'Vous n\'avez pas les permissions nécessaires pour accéder à votre profil.'
          });
        } else {
          setProfileError({
            type: 'database',
            message: 'Erreur de base de données',
            details: error.message
          });
        }

        throw error;
      }

      if (!data) {
        console.warn('[AuthContext] No profile found for user:', userId);

        if (retryCount < MAX_RETRIES) {
          console.log(`[AuthContext] Retrying in ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return loadProfile(userId, retryCount + 1);
        }

        console.error('[AuthContext] Profile not found after all retries');
        setProfileError({
          type: 'not_found',
          message: 'Profil introuvable',
          details: 'Impossible de trouver votre profil après plusieurs tentatives. Veuillez contacter le support.'
        });
        setLoading(false);
        return;
      }

      console.log('[AuthContext] Profile loaded successfully:', data.email);
      setProfile(data);
      setProfileError(null);
    } catch (error: any) {
      console.error('[AuthContext] Error loading profile:', error);

      if (retryCount < MAX_RETRIES) {
        console.log(`[AuthContext] Retrying after error in ${RETRY_DELAY * (retryCount + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return loadProfile(userId, retryCount + 1);
      }

      if (!profileError) {
        setProfileError({
          type: 'unknown',
          message: 'Erreur inconnue',
          details: error.message || 'Une erreur inattendue s\'est produite.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: { full_name: string; user_type?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type || 'locataire',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) return { error };

      if (data.user && !data.session) {
        return { error: null };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signInWithProvider = async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;
    await loadProfile(user.id);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      setProfileError(null);
      await loadProfile(user.id);
    }
  };

  const clearProfileError = () => {
    setProfileError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      profileError,
      signIn,
      signUp,
      signInWithProvider,
      signOut,
      updateProfile,
      resetPassword,
      refreshProfile,
      clearProfileError,
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
