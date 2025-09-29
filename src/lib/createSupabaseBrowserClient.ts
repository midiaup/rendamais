import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

export const createSupabaseBrowserClient = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
