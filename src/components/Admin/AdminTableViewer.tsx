'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminTableViewerProps {
  supabase: SupabaseClient;
}

interface TableConfig {
  name: string;
  label: string;
  description?: string;
}

type RowData = Record<string, unknown>;

const TABLES: TableConfig[] = [
  { name: 'profiles', label: 'Perfis', description: 'Dados cadastrais dos usuários.' },
  { name: 'wallets', label: 'Carteiras', description: 'Chaves PIX e endereços de cripto.' },
  { name: 'donations', label: 'Doações', description: 'Histórico de doações registradas.' },
  { name: 'donation_events', label: 'Eventos de Doações', description: 'Log detalhado das movimentações de doações.' },
  { name: 'notifications', label: 'Notificações', description: 'Alertas e mensagens enviadas aos perfis.' },
  { name: 'chat_threads', label: 'Chats', description: 'Conversas abertas no suporte.' },
  { name: 'chat_messages', label: 'Mensagens do Chat', description: 'Mensagens trocadas em cada chat.' },
  { name: 'pix_movements', label: 'Movimentações PIX', description: 'Registros de entradas e saídas via PIX.' },
  { name: 'usdt_movements', label: 'Movimentações USDT', description: 'Registros de entradas e saídas em USDT.' },
  { name: 'registration_flows', label: 'Fluxos de Cadastro', description: 'Etapas e status de cadastro.' },
  { name: 'registration_flow_events', label: 'Eventos do Fluxo', description: 'Histórico de eventos do fluxo de cadastro.' },
  { name: 'matrix_positions', label: 'Posições de Matriz', description: 'Organização dos perfis nas matrizes.' },
  { name: 'wallet_logs', label: 'Logs de Carteiras', description: 'Histórico de alterações em carteiras.' },
];

export default function AdminTableViewer({ supabase }: AdminTableViewerProps) {
  const [selectedTable, setSelectedTable] = useState<TableConfig>(TABLES[0]);
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  const columns = useMemo(() => {
    if (!data.length) return [];
    const columnSet = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => columnSet.add(key));
    });
    return Array.from(columnSet);
  }, [data]);

  const fetchData = useCallback(async (table: TableConfig, rowLimit: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data: tableData, error: tableError } = await supabase
        .from(table.name)
        .select('*')
        .limit(rowLimit);

      if (tableError) {
        throw new Error(tableError.message);
      }

      setData(tableData ?? []);
    } catch (err) {
      console.error('Erro ao carregar tabela:', err);
      setData([]);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar tabela.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData(selectedTable, limit);
  }, [fetchData, limit, selectedTable]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Planilhas e Tabelas</h2>
          <p className="text-sm text-gray-400">Visualize registros diretamente das tabelas do Supabase.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            Limite:
            <input
              type="number"
              min={10}
              max={500}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="w-20 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <select
            value={selectedTable.name}
            onChange={(event) => {
              const table = TABLES.find((tbl) => tbl.name === event.target.value);
              if (table) {
                setSelectedTable(table);
              }
            }}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {TABLES.map((table) => (
              <option key={table.name} value={table.name}>
                {table.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchData(selectedTable, limit)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Atualizar
          </button>
        </div>
      </div>

      {selectedTable.description && (
        <p className="mb-4 text-sm text-gray-400">{selectedTable.description}</p>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300"
                >
                  {column}
                </th>
              ))}
              {!columns.length && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Sem dados
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/40">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-400" colSpan={columns.length || 1}>
                  Carregando registros...
                </td>
              </tr>
            ) : data.length ? (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-800/50">
                  {columns.map((column) => {
                    const value = row[column];
                    const displayValue = typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : value ?? '';

                    return (
                      <td key={`${column}-${index}`} className="whitespace-nowrap px-4 py-3 text-sm text-gray-200">
                        {String(displayValue)}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-400" colSpan={columns.length || 1}>
                  Nenhum registro encontrado para esta tabela.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
