'use client';

import { useState } from 'react';

type TestFunctionResult = {
  function: string;
  success: boolean;
  error?: string;
  result?: unknown;
  count?: number;
  code?: string;
};

type TestTableResult = {
  table: string;
  success: boolean;
  error?: string;
  count?: number;
};

interface TestResponse {
  success: boolean;
  message: string;
  functions: TestFunctionResult[];
  tables: TestTableResult[];
}

export default function FunctionTestRunner() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/setup/test-functions', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Falha ao executar testes.');
      }
      const data = (await response.json()) as TestResponse;
      setResults(data);
    } catch (err) {
      console.error('Erro ao executar testes:', err);
      setResults(null);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao executar testes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Testes de Funcionamento</h2>
          <p className="text-sm text-gray-400">Execute verificações das funções SQL essenciais e das tabelas base.</p>
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Executando...' : 'Rodar testes' }
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Funções SQL</h3>
            <div className="space-y-3">
              {results.functions.map((item) => (
                <div
                  key={item.function}
                  className={`rounded-lg border px-4 py-3 text-sm ${item.success ? 'border-emerald-700 bg-emerald-900/20 text-emerald-200' : 'border-red-700 bg-red-900/20 text-red-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.function}</span>
                    <span className="text-xs uppercase tracking-wide">{item.success ? 'OK' : 'Erro'}</span>
                  </div>
                  {!item.success && item.error && (
                    <p className="mt-2 text-xs text-red-200/80">{item.error}</p>
                  )}
                  {item.success && typeof item.count === 'number' && (
                    <p className="mt-2 text-xs text-emerald-200/80">Registros: {item.count}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-3">Tabelas Monitoradas</h3>
            <div className="space-y-3">
              {results.tables.map((item) => (
                <div
                  key={item.table}
                  className={`rounded-lg border px-4 py-3 text-sm ${item.success ? 'border-emerald-700 bg-emerald-900/20 text-emerald-200' : 'border-red-700 bg-red-900/20 text-red-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.table}</span>
                    <span className="text-xs uppercase tracking-wide">{item.success ? 'OK' : 'Erro'}</span>
                  </div>
                  {!item.success && item.error && (
                    <p className="mt-2 text-xs text-red-200/80">{item.error}</p>
                  )}
                  {item.success && typeof item.count === 'number' && (
                    <p className="mt-2 text-xs text-emerald-200/80">Registros: {item.count}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !results && !error && (
        <p className="text-sm text-gray-500">Clique em &quot;Rodar testes&quot; para verificar o status das funções.</p>
      )}
    </section>
  );
}
