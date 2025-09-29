import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseConfig';

// DashboardLayout removido - já aplicado pelo layout.tsx
import { SettingsForm } from './SettingsForm'; // Client component

async function getSettingsData(supabase: any, userId: string) {
  // First, get the profile_id associated with the user_id
  const { data: profileData, error: profileIdError } = await supabase
    .from('profiles')
    .select('id, name, username, email, whatsapp')
    .eq('user_id', userId)
    .single();

  if (profileIdError) {
    console.error('Error fetching profile:', profileIdError);
    return { profile: null, wallets: { pix: '', usdt: '' } };
  }

  const { data: walletsData, error: walletsError } = await supabase
    .from('wallets')
    .select('type, address_or_pix')
    .eq('profile_id', profileData.id);

  if (walletsError) {
    console.error('Error fetching wallets:', walletsError);
    // Proceed with profile data even if wallets fail
  }

  const wallets = {
    pix: walletsData?.find(w => w.type === 'PIX')?.address_or_pix || '',
    usdt: walletsData?.find(w => w.type === 'USDT_BEP20')?.address_or_pix || '',
  };

  return { profile: profileData, wallets };
}

export default async function SettingsPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { profile, wallets } = await getSettingsData(supabase, user.id);

  if (!profile) {
    // Handle case where profile is not found, maybe redirect or show an error
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Erro</h1>
        <p className="text-white">Não foi possível carregar os dados do perfil.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-lg text-gray-400 mt-1">Gerencie suas informações de perfil, senha e carteiras.</p>
      </div>
      <SettingsForm profile={profile} wallets={wallets} />
    </div>
  );
}