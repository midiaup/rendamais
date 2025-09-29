'use client';

import { useCallback, useEffect, useState } from 'react';

type Movement = {
  id: string;
  profile_id: string | null;
  amount: number;
  status?: string | null;
  direction?: string | null;
  created_at: string;
  reference?: string | null;
  tx_hash?: string | null;
};

type PaymentReportResponse = {
  success: boolean;
  totals?: {
    pix: number;
    usdt: number;
    combined: number;
  };
  warnings?: string[];
  pix?: Movement[];
  usdt?: Movement[];
  error?: string;
};

const formatCurrency = (value: number, currency: 'BRL' | 'USD') =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value || 0);

export default function PaymentReports() {
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pixMovements, setPixMovements] = useState<Movement[]>([]);
  const [usdtMovements, setUsdtMovements] = useState<Movement[]>([]);
  const [totals, setTotals] = useState<{ pix: number; usdt: number; combined: number }>({ pix: 0, usdt: 0, combined: 0 });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports/payments?days=${days}&limit=${limit}`);
      const data = (await response.json()) as PaymentReportResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível gerar o relatório.');
      }

      setPixMovements(data.pix ?? []);
      setUsdtMovements(data.usdt ?? []);
      setWarnings(data.warnings ?? []);
      setTotals(data.totals ?? { pix: 0, usdt: 0, combined: 0 });
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao consultar relatório.');
      setPixMovements([]);
      setUsdtMovements([]);
      setTotals({ pix: 0, usdt: 0, combined: 0 });
    } finally {
      setLoading(false);
    }
  }, [days, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Relatórios de PIX &amp; USDT</h2>
          <p className="text-sm text-gray-400">Acompanhe movimentações recentes e o total consolidado por método de pagamento.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm text-gray-300 flex items-center gap-2">
            Dias:
            <input
              type="number"
              min={1}
              max={180}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="w-20 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-sm text-gray-300 flex items-center gap-2">
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
          <button
            onClick={fetchReports}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((warning) => (
            <div key={warning} className="rounded-md border border-yellow-600 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">
              {warning}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
          <h3 className="text-sm text-gray-400">Total PIX</h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(totals.pix, 'BRL')}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
          <h3 className="text-sm text-gray-400">Total USDT</h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(totals.usdt, 'USD')}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
          <h3 className="text-sm text-gray-400">Total Geral (conversão simples)</h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(totals.combined, 'BRL')}</p>
          <p className="mt-1 text-xs text-gray-500">*Considerando PIX em BRL e USDT convertido 1:1.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Movimentações PIX</h3>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-800">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Perfil</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Direção</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                {pixMovements.length ? (
                  pixMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-4 py-2 text-sm text-gray-200">{movement.profile_id ?? 'N/D'}</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{formatCurrency(movement.amount, 'BRL')}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{movement.status ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{movement.direction ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{new Date(movement.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={5}>
                      Nenhuma movimentação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-white mb-3">Movimentações USDT</h3>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-800">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Perfil</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Direção</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Referência</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                {usdtMovements.length ? (
                  usdtMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-4 py-2 text-sm text-gray-200">{movement.profile_id ?? 'N/D'}</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{formatCurrency(movement.amount, 'USD')}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{movement.status ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{movement.direction ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{movement.tx_hash ?? movement.reference ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{new Date(movement.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={6}>
                      Nenhuma movimentação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
