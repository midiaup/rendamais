
import { create } from 'zustand';
import { createBrowserClient } from '@supabase/ssr';
import { Session } from '@supabase/supabase-js';

// Create a single supabase client for the store
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
