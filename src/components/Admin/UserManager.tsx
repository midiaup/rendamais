'use client';

import { useCallback, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UserManagerProps {
  supabase: SupabaseClient;
}

type ProfileRecord = {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  [key: string]: unknown;
};

const EDITABLE_FIELDS: { key: keyof ProfileRecord; label: string; type: 'text' | 'email' | 'tel' | 'boolean'; placeholder?: string }[] = [
  { key: 'name', label: 'Nome completo', type: 'text', placeholder: 'Nome do usuário' },
  { key: 'username', label: 'Usuário', type: 'text', placeholder: 'Identificador interno' },
  { key: 'email', label: 'E-mail', type: 'email', placeholder: 'email@exemplo.com' },
  { key: 'whatsapp', label: 'WhatsApp', type: 'tel', placeholder: 'Número com DDD' },
  { key: 'country', label: 'País', type: 'text', placeholder: 'País' },
  { key: 'status', label: 'Status', type: 'text', placeholder: 'active | inactive | pending' },
  { key: 'is_active', label: 'Ativo', type: 'boolean' },
];

export default function UserManager({ supabase }: UserManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProfileRecord[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileRecord | null>(null);
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setFeedback('Informe nome, e-mail ou WhatsApp para pesquisar.');
      return;
    }

    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${searchTerm.trim()}%,username.ilike.%${searchTerm.trim()}%,whatsapp.ilike.%${searchTerm.trim()}%`)
        .limit(20);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setResults(data ?? []);
      if (!data?.length) {
        setFeedback('Nenhum perfil encontrado. Ajuste os filtros e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao pesquisar perfis:', err);
      setResults([]);
      setFeedback(null);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar perfis.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, supabase]);

  const selectProfile = useCallback((profile: ProfileRecord) => {
    setSelectedProfile(profile);
    setFormState(profile);
    setFeedback(null);
    setError(null);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!selectedProfile) return;

    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const updates: Record<string, unknown> = {};
      EDITABLE_FIELDS.forEach(({ key }) => {
        if (key in formState) {
          updates[key as string] = formState[key];
        }
      });

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedProfile.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setFeedback('Perfil atualizado com sucesso!');
      setSelectedProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setFeedback(null);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  }, [formState, selectedProfile, supabase]);

  const selectedFields = useMemo(() => {
    if (!selectedProfile) return [];
    return EDITABLE_FIELDS.filter((field) => field.key in selectedProfile);
  }, [selectedProfile]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestão de Usuários</h2>
          <p className="text-sm text-gray-400">Pesquise perfis e atualize dados cadastrais diretamente da base.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp"
            className="w-full md:w-80 rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Buscando...' : 'Pesquisar'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 rounded-md border border-emerald-700 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
          {feedback}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Resultados</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {results.map((profile) => (
              <button
                key={profile.id}
                onClick={() => selectProfile(profile)}
                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition ${selectedProfile?.id === profile.id ? 'border-emerald-600 bg-emerald-900/30 text-emerald-100' : 'border-gray-800 bg-gray-800/40 text-gray-200 hover:border-emerald-600 hover:text-white'}`}
              >
                <p className="font-medium">{profile.name || profile.username || 'Usuário sem nome'}</p>
                <p className="text-xs text-gray-400">{profile.email || 'Sem e-mail'}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                  {profile.status && <span className="rounded bg-gray-800 px-2 py-1">Status: {profile.status}</span>}
                  {'is_active' in profile && (
                    <span className="rounded bg-gray-800 px-2 py-1">{profile.is_active ? 'Ativo' : 'Inativo'}</span>
                  )}
                </div>
              </button>
            ))}
            {!results.length && (
              <p className="text-sm text-gray-500">Realize uma busca para listar usuários.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-white mb-3">Editar cadastro</h3>
          {selectedProfile ? (
            <div className="space-y-4">
              {selectedFields.length ? selectedFields.map((field) => (
                <div key={field.key as string}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                  {field.type === 'boolean' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(formState[field.key])}
                        onChange={(event) => setFormState((prev) => ({ ...prev, [field.key]: event.target.checked }))}
                        className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-300">Ativar usuário</span>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={(formState[field.key] as string | number | undefined) ?? ''}
                      placeholder={field.placeholder}
                      onChange={(event) => setFormState((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              )) : (
                <p className="text-sm text-gray-500">Nenhum campo editável disponível para este perfil.</p>
              )}

              <button
                onClick={handleUpdate}
                disabled={loading}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Selecione um usuário na lista para editar os dados.</p>
          )}
        </div>
      </div>
    </section>
  );
}
