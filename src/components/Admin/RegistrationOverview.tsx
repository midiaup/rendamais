'use client';

import { useEffect, useState } from 'react';

type ProfileSummary = {
  id: string;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  created_at: string;
};

type RegistrationFlow = {
  id: string;
  profile_id: string;
  status?: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at?: string | null;
};

type RegistrationEvent = {
  id: string;
  flow_id: string;
  event_type?: string | null;
  description?: string | null;
  created_at: string;
};

type RegistrationOverviewResponse = {
  success: boolean;
  totals?: {
    active: number;
    inactive: number;
    byStatus: Record<string, number>;
  };
  profiles?: ProfileSummary[];
  flows?: RegistrationFlow[];
  events?: RegistrationEvent[];
  error?: string;
};

export default function RegistrationOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ active: number; inactive: number; byStatus: Record<string, number> }>({
    active: 0,
    inactive: 0,
    byStatus: {},
  });
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [flows, setFlows] = useState<RegistrationFlow[]>([]);
  const [events, setEvents] = useState<RegistrationEvent[]>([]);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/registration/overview');
        const data = (await response.json()) as RegistrationOverviewResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Não foi possível obter o panorama de cadastros.');
        }
        setTotals(data.totals ?? { active: 0, inactive: 0, byStatus: {} });
        setProfiles(data.profiles ?? []);
        setFlows(data.flows ?? []);
        setEvents(data.events ?? []);
      } catch (err) {
        console.error('Erro ao carregar panorama de cadastros:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados de cadastro.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const statusEntries = Object.entries(totals.byStatus);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Fluxo de Cadastros</h2>
        <p className="text-sm text-gray-400">Visualize o volume de cadastros ativos e inativos, além das últimas movimentações de fluxo.</p>
      </div>

      {loading && (
        <div className="mb-4 rounded-md border border-emerald-700 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
          Carregando panorama de cadastros...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
          <h3 className="text-sm text-gray-400">Cadastros ativos</h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{totals.active}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
          <h3 className="text-sm text-gray-400">Cadastros inativos</h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{totals.inactive}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
          <h3 className="text-sm text-gray-400">Status detalhado</h3>
          {statusEntries.length ? (
            <ul className="mt-2 space-y-1 text-sm text-gray-300">
              {statusEntries.map(([status, count]) => (
                <li key={status} className="flex items-center justify-between">
                  <span className="capitalize">{status}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Sem dados de status disponíveis.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Últimos cadastros</h3>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-800">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Nome</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">E-mail</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                {profiles.length ? (
                  profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="px-4 py-2 text-sm text-gray-200">{profile.name || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{profile.email || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{profile.status || (profile.is_active ? 'active' : 'inactive')}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{new Date(profile.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={4}>
                      Nenhum cadastro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Fluxos recentes</h3>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900/40 divide-y divide-gray-800">
              {flows.length ? flows.map((flow) => (
                <div key={flow.id} className="px-4 py-3 text-sm text-gray-200">
                  <p className="font-medium">Fluxo #{flow.id}</p>
                  <p className="text-xs text-gray-400">Perfil: {flow.profile_id}</p>
                  <p className="text-xs text-gray-400">Status: {flow.status || (flow.is_active ? 'active' : 'inactive')}</p>
                  <p className="text-xs text-gray-500 mt-1">Atualizado em {flow.updated_at ? new Date(flow.updated_at).toLocaleString() : '—'}</p>
                </div>
              )) : (
                <p className="px-4 py-3 text-sm text-gray-500">Nenhum fluxo recente encontrado.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-3">Eventos do fluxo</h3>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900/40 divide-y divide-gray-800">
              {events.length ? events.map((event) => (
                <div key={event.id} className="px-4 py-3 text-sm text-gray-200">
                  <p className="font-medium">Evento {event.event_type || event.id}</p>
                  <p className="text-xs text-gray-400">Flow: {event.flow_id}</p>
                  {event.description && <p className="text-xs text-gray-400">{event.description}</p>}
                  <p className="text-xs text-gray-500 mt-1">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              )) : (
                <p className="px-4 py-3 text-sm text-gray-500">Nenhum evento recente registrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
