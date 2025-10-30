import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: AuthError | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    userData: { full_name: string; user_type: string }
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        profile: null,
        session: null,
        loading: true,
        initialized: false,
        error: null,

        initialize: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
              set({ session, user: session.user });
              await get().loadProfile(session.user.id);
            }

            set({ initialized: true, loading: false });

            // Set up auth state listener
            supabase.auth.onAuthStateChange((_event, session) => {
              (async () => {
                set({ session, user: session?.user ?? null });
                if (session?.user) {
                  await get().loadProfile(session.user.id);
                } else {
                  set({ profile: null, loading: false });
                }
              })();
            });
          } catch (error) {
            console.error('Error initializing auth:', error);
            set({ initialized: true, loading: false });
          }
        },

        loadProfile: async (userId: string) => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();

            if (error) throw error;
            set({ profile: data, loading: false });
          } catch (error) {
            console.error('Error loading profile:', error);
            set({ loading: false });
          }
        },

        signIn: async (email: string, password: string) => {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ error, loading: false });
          }

          return { error };
        },

        signUp: async (
          email: string,
          password: string,
          userData: { full_name: string; user_type: string }
        ) => {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: userData.full_name,
                user_type: userData.user_type,
              },
            },
          });

          if (error) {
            set({ error, loading: false });
          }

          return { error };
        },

        signOut: async () => {
          set({ loading: true });
          await supabase.auth.signOut();
          set({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          });
        },

        updateProfile: async (updates: Partial<Profile>) => {
          const { user } = get();
          if (!user) return;

          set({ loading: true, error: null });

          try {
            const { error } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', user.id);

            if (error) throw error;
            await get().loadProfile(user.id);
          } catch (error) {
            console.error('Error updating profile:', error);
            set({ loading: false });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          session: state.session,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
