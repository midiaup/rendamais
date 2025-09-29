import { create } from 'zustand';
import { createSupabaseBrowserClient } from '@/lib/createSupabaseBrowserClient';

// Create a single supabase client for the store
const supabase = createSupabaseBrowserClient();

// Define the type based on your 'profiles' table schema
export type Profile = {
  id: string;
  user_id: string;
  name: string;
  username: string;
  email: string;
  whatsapp: string;
  country: string;
  avatar_url: string;
  pix_wallet?: string | null;
  usdt_wallet?: string | null;
};

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: true,
  error: null,
  fetchProfile: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      set({ profile: data, loading: false, error: null });
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred while fetching the profile.';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error fetching profile:', error.message);
      } else {
        console.error('An unknown error occurred while fetching the profile.');
      }
      set({ profile: null, loading: false, error: errorMessage });
    }
  },
}));
