'use client';

import { useCallback, useEffect, useState } from 'react';

type ChatThread = {
  id: string;
  profile_id: string;
  subject?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string | null;
  unread_count?: number | null;
};

type ChatMessage = {
  id: string;
  thread_id: string;
  sender_type?: string | null;
  message: string;
  created_at?: string;
};

interface ChatResponse {
  success: boolean;
  threads?: ChatThread[];
  messages?: ChatMessage[];
  error?: string;
}

export default function ChatSupportConsole() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [closeThread, setCloseThread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/chat');
      const data = (await response.json()) as ChatResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível carregar os chats.');
      }
      setThreads(data.threads ?? []);
    } catch (err) {
      console.error('Erro ao carregar threads:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar chats.');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const fetchMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/chat?threadId=${threadId}`);
      const data = (await response.json()) as ChatResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível carregar mensagens.');
      }
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    } else {
      setMessages([]);
    }
  }, [fetchMessages, selectedThread]);

  const handleSelectThread = (thread: ChatThread) => {
    setSelectedThread(thread);
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: selectedThread.id,
          message: newMessage.trim(),
          closeThread,
        }),
      });

      const data = (await response.json()) as ChatResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível enviar a mensagem.');
      }

      setNewMessage('');
      setCloseThread(false);
      await fetchMessages(selectedThread.id);
      await fetchThreads();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem.');
    }
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Atendimento do Chat</h2>
        <p className="text-sm text-gray-400">Gerencie conversas abertas e responda diretamente aos usuários da plataforma.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-white">Conversas</h3>
            <button
              onClick={fetchThreads}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              disabled={loadingThreads}
            >
              {loadingThreads ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread)}
                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition ${selectedThread?.id === thread.id ? 'border-emerald-600 bg-emerald-900/30 text-emerald-100' : 'border-gray-800 bg-gray-800/40 text-gray-200 hover:border-emerald-600 hover:text-white'}`}
              >
                <p className="font-medium">{thread.subject || 'Chat sem assunto'}</p>
                <p className="text-xs text-gray-400">Perfil: {thread.profile_id}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  {thread.status && <span className="rounded bg-gray-800 px-2 py-1">{thread.status}</span>}
                  {typeof thread.unread_count === 'number' && thread.unread_count > 0 && (
                    <span className="rounded bg-emerald-900/60 px-2 py-1 text-emerald-200">{thread.unread_count} pendente(s)</span>
                  )}
                </div>
              </button>
            ))}
            {!threads.length && (
              <p className="text-sm text-gray-500">Nenhuma conversa encontrada.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium text-white mb-3">Mensagens</h3>
          <div className="rounded-lg border border-gray-800 bg-gray-900/40 h-80 overflow-y-auto p-4 space-y-3">
            {loadingMessages ? (
              <p className="text-sm text-gray-500">Carregando mensagens...</p>
            ) : messages.length ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg px-4 py-3 text-sm ${message.sender_type === 'admin' ? 'bg-emerald-900/40 border border-emerald-700 text-emerald-100 ml-auto max-w-[80%]' : 'bg-gray-800/60 border border-gray-700 text-gray-200 max-w-[80%]'}`}
                >
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                    {message.sender_type === 'admin' ? 'Admin' : message.sender_type || 'Usuário'}
                  </p>
                  <p>{message.message}</p>
                  {message.created_at && (
                    <p className="mt-2 text-[10px] uppercase text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Selecione uma conversa para visualizar as mensagens.</p>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              rows={3}
              placeholder="Escreva sua resposta"
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={closeThread}
                  onChange={(event) => setCloseThread(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-emerald-600 focus:ring-emerald-500"
                />
                Encerrar conversa após responder
              </label>
              <button
                onClick={handleSendMessage}
                disabled={!selectedThread || !newMessage.trim()}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Enviar resposta
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
