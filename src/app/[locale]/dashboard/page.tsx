// src/app/dashboard/page.tsx

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getTranslations } from 'next-intl/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseConfig';

// DashboardLayout removido - já aplicado pelo layout.tsx
import StatCard from '@/components/Dashboard/StatCard';
import MatrixView from '@/components/Dashboard/MatrixView';
import GlobalActivityFeed from '@/components/Dashboard/GlobalActivityFeed';

// O resto do seu arquivo (Types, Icons, funções de busca de dados) permanece o mesmo...
type Participant = { participant_id: string; username: string; email: string; whatsapp: string; level: number; status: string; position: number; };
const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0ZM10.5 1.5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /></svg>;
const CurrencyDollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 11.21 12.77 11 12 11s-1.536.21-2.121.538c-1.171.879-1.171 2.303 0 3.182Z" /></svg>;
const ArrowPathIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691v4.992m0 0h-4.992m4.992 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 16.65m4.992-4.992h-4.992" /></svg>;
async function getUserDashboardData(supabase: SupabaseClient, userId: string) { if (!userId) { return { donatedBRL: 0, receivedBRL: 0, donatedUSD: 0, receivedUSD: 0, userLevel: 0, userStatus: 'Inactive', totalCycles: 0, }; } const rpcParams = { p_user_id: userId }; try { const [ { data: donatedBRL, error: donatedBRLError }, { data: receivedBRL, error: receivedBRLError }, { data: donatedUSD, error: donatedUSDError }, { data: receivedUSD, error: receivedUSDError }, { data: userStats, error: userStatsError }, { data: totalCycles, error: totalCyclesError }, ] = await Promise.all([ supabase.rpc('get_user_donated_brl', rpcParams), supabase.rpc('get_user_received_brl', rpcParams), supabase.rpc('get_user_donated_usd', rpcParams), supabase.rpc('get_user_received_usd', rpcParams), supabase.rpc('get_user_dashboard_stats', rpcParams), supabase.rpc('get_user_total_cycles', rpcParams), ]); if (donatedBRLError) console.error("Error fetching user donated BRL:", donatedBRLError.message); if (receivedBRLError) console.error("Error fetching user received BRL:", receivedBRLError.message); if (donatedUSDError) console.error("Error fetching user donated USD:", donatedUSDError.message); if (receivedUSDError) console.error("Error fetching user received USD:", receivedUSDError.message); if (userStatsError) console.error("Error fetching user stats:", userStatsError.message); if (totalCyclesError) console.error("Error fetching user total cycles:", totalCyclesError.message); const statsData = Array.isArray(userStats) && userStats.length > 0 ? userStats[0] : null; return { donatedBRL: Number(donatedBRL) || 0, receivedBRL: Number(receivedBRL) || 0, donatedUSD: Number(donatedUSD) || 0, receivedUSD: Number(receivedUSD) || 0, userLevel: statsData?.user_level || 0, userStatus: statsData?.user_status || 'Inactive', totalCycles: totalCycles || 0, }; } catch (error) { console.error("Unexpected error in getUserDashboardData:", error); return { donatedBRL: 0, receivedBRL: 0, donatedUSD: 0, receivedUSD: 0, userLevel: 0, userStatus: 'Inactive', totalCycles: 0, }; } }
async function getMatrixData(supabase: SupabaseClient, userId: string) {
  if (!userId) return {};
  const matrixTypes = [
    'RENDA_10_BRL',
    'RENDA_10_USD',
    'RENDA_50_BRL',
    'RENDA_50_USD',
    'RENDA_100_BRL',
    'RENDA_100_USD'
  ];
  try {
    const rpcCalls = matrixTypes.map(type =>
      supabase.rpc('get_matrix_participants', { p_user_id: userId, p_matrix_type: type })
    );
    const results = await Promise.all(rpcCalls);
    const matrixData: { [key: string]: Participant[] } = {};
    results.forEach((result, index) => {
      const type = matrixTypes[index];
      if (result.error) {
        console.error(`Error fetching participants for ${type}:`, result.error.message);
        matrixData[type] = [];
      } else {
        matrixData[type] = ((result.data as Participant[]) || []).map((p) => ({
          ...p,
          position: typeof p.position === 'number' ? p.position : 0,
        }));
      }
    });
    return matrixData;
  } catch (error) {
    console.error("Unexpected error in getMatrixData:", error);
    return {};
  }
}


export default async function DashboardPage() {
  // CORREÇÃO 2: A chamada da função foi ajustada.
  // O locale é pego automaticamente pelo middleware, então só precisamos passar o "namespace" (o nome do grupo de traduções no arquivo JSON).
  const t = await getTranslations('Dashboard');
  
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  
  const dashboardData = await getUserDashboardData(supabase, user.id);
  const matrixData = await getMatrixData(supabase, user.id);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('donationsMade')}
          isCurrency
          valueBRL={dashboardData.donatedBRL}
          valueUSD={dashboardData.donatedUSD}
          icon={<CurrencyDollarIcon />}
        />
        <StatCard
          title={t('donationsReceived')}
          isCurrency
          valueBRL={dashboardData.receivedBRL}
          valueUSD={dashboardData.receivedUSD}
          icon={<CurrencyDollarIcon />}
        />
        <StatCard
          title={t('currentLevel')}
          value={t('level', { level: dashboardData.userLevel })}
          subtitle={t(dashboardData.userStatus.toLowerCase())}
          icon={<UserGroupIcon />}
        />
        <StatCard
          title={t('totalCycles')}
          value={dashboardData.totalCycles.toString()}
          icon={<ArrowPathIcon />}
        />
      </div>

      {/* Visualização de Matrizes */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">{t('matrixView')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MatrixView title={t('matrix.renda10_brl')} currency="R$" participants={matrixData['RENDA_10_BRL'] as Participant[] || []} />
          <MatrixView title={t('matrix.renda10_usd')} currency="$" participants={matrixData['RENDA_10_USD'] as Participant[] || []} />
          <MatrixView title={t('matrix.renda50_brl')} currency="R$" participants={matrixData['RENDA_50_BRL'] as Participant[] || []} />
          <MatrixView title={t('matrix.renda50_usd')} currency="$" participants={matrixData['RENDA_50_USD'] as Participant[] || []} />
          <MatrixView title={t('matrix.renda100_brl')} currency="R$" participants={matrixData['RENDA_100_BRL'] as Participant[] || []} />
          <MatrixView title={t('matrix.renda100_usd')} currency="$" participants={matrixData['RENDA_100_USD'] as Participant[] || []} />
        </div>
      </div>

      <GlobalActivityFeed />
    </div>
  );
}