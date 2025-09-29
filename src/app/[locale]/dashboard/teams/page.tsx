'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/createSupabaseBrowserClient';
import { useProfileStore, Profile } from '@/stores/profileStore';

type User = { username: string; email: string; whatsapp: string; status: string; level: number; cycle: number; };

const TeamStatCard = ({ title, count }: { title: string; count: number }) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-gray-400 text-lg font-medium">{title}</h3>
    <p className="text-4xl font-bold text-white mt-2">{count}</p>
  </div>
);

const UsersTable = ({ users }: { users: User[] }) => (
  <div className="overflow-x-auto">
    {users.length > 0 ? (
      <table className="min-w-full bg-gray-800 rounded-lg">
        <thead className="bg-gray-700">
          <tr>
            {['Username', 'Email', 'WhatsApp', 'Status', 'Nível', 'Ciclo'].map((h) => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {users.map((user) => (
            <tr key={user.email}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.username}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.whatsapp}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'ativo' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.level}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.cycle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-center text-gray-400">Nenhum usuário encontrado nesta categoria.</p>
    )}
  </div>
);

export default function TeamsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { profile } = useProfileStore();
  const [activeTab, setActiveTab] = useState<'direct' | 'indirect' | 'spillover'>('direct');
  const [directs, setDirects] = useState<User[]>([]);
  const [indirects, setIndirects] = useState<User[]>([]);
  const [spillovers, setSpillovers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const formatUserData = (data: Partial<Profile>[]): User[] =>
    data.map((p) => ({
      username: p.username || '',
      email: p.email || '',
      whatsapp: p.whatsapp || '',
      status: p.is_active ? 'ativo' : 'inativo',
      level: 1,
      cycle: 1,
    }));

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      setLoading(true);

      let data = [] as Partial<Profile>[];
      let error = null;

      if (activeTab === 'direct') {
        ({ data, error } = await supabase.from('profiles').select('*').eq('referrer_user_id', profile.user_id));
        if (!error) setDirects(formatUserData(data || []));
      } else if (activeTab === 'indirect') {
        ({ data, error } = await supabase.rpc('get_indirect_referrals', { p_user_id: profile.user_id }));
        if (!error) setIndirects(formatUserData(data || []));
      } else if (activeTab === 'spillover') {
        ({ data, error } = await supabase.rpc('get_spillover_users', { p_user_id: profile.user_id, p_matrix_type: 'RENDA_10' }));
        if (!error) setSpillovers(formatUserData(data || []));
      }

      if (error) console.error(`Error fetching ${activeTab}:`, error);
      setLoading(false);
    };

    fetchData();
  }, [profile, activeTab, supabase]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Minhas Equipes</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TeamStatCard title="Indicados Diretos" count={directs.length} />
        <TeamStatCard title="Indicados Indiretos" count={indirects.length} />
        <TeamStatCard title="Derramamento" count={spillovers.length} />
      </div>

      <div>
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('direct')}
              className={`${
                activeTab === 'direct'
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
            >
              Diretos
            </button>
            <button
              onClick={() => setActiveTab('indirect')}
              className={`${
                activeTab === 'indirect'
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
            >
              Indiretos
            </button>
            <button
              onClick={() => setActiveTab('spillover')}
              className={`${
                activeTab === 'spillover'
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
            >
              Derramamento
            </button>
          </nav>
        </div>
        <div className="py-6">
          {loading ? (
            <p className="text-center text-gray-400">Carregando...</p>
          ) : (
            <>
              {activeTab === 'direct' && <UsersTable users={directs} />}
              {activeTab === 'indirect' && <UsersTable users={indirects} />}
              {activeTab === 'spillover' && <UsersTable users={spillovers} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
