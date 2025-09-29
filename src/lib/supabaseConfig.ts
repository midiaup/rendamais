const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://jhicvtxawksiudijcxxn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWN2dHhhd2tzaXVkaWpjeHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MjMwMTcsImV4cCI6MjA3Mzk5OTAxN30.D4dYewksoxdyLq698GUp73skymfgmj220oZCixvEJGM';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase credentials are not configured.');
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
