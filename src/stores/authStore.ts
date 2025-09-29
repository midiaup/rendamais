import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/createSupabaseBrowserClient';

// Create a single supabase client for the store
const supabase = createSupabaseBrowserClient();

type AuthState = {
  session: Session | null;
  setSession: (session: Session | null) => void;
  checkSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  checkSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      set({ session: null });
      return;
    }
    set({ session: data.session });
  },
}));

// Initialize session check on load
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
});
