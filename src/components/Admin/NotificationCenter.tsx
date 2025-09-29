'use client';

import { useCallback, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

interface NotificationCenterProps {
  supabase: SupabaseClient;
}

type Recipient = {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
};

type NotificationTarget = 'individual' | 'collective';

type NotificationResponse = {
  success: boolean;
  inserted?: number;
  error?: string;
};

export default function NotificationCenter({ supabase }: NotificationCenterProps) {
  const [target, setTarget] = useState<NotificationTarget>('individual');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high'>('normal');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [creatingAlert, setCreatingAlert] = useState(false);

  const findRecipient = useCallback(async () => {
    if (!recipientQuery.trim()) {
      setError('Informe e-mail, usuário ou nome para localizar o destinatário.');
      return;
    }

    setError(null);
    setFeedback(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('id, name, email, username')
        .or(`email.ilike.%${recipientQuery.trim()}%,username.ilike.%${recipientQuery.trim()}%,name.ilike.%${recipientQuery.trim()}%`)
        .limit(1)
        .maybeSingle();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!data) {
        setSelectedRecipient(null);
        setError('Usuário não encontrado. Verifique o identificador informado.');
        return;
      }

      setSelectedRecipient(data);
      setFeedback(`Destinatário selecionado: ${data.name || data.username || data.email}`);
    } catch (err) {
      console.error('Erro ao localizar destinatário:', err);
      setSelectedRecipient(null);
      setFeedback(null);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar usuário.');
    }
  }, [recipientQuery, supabase]);

  const sendNotification = useCallback(async () => {
    if (!message.trim()) {
      setError('Informe uma mensagem para enviar.');
      return;
    }

    if (target === 'individual' && !selectedRecipient) {
      setError('Selecione um destinatário para o envio individual.');
      return;
    }

    setSending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: target,
          profileId: selectedRecipient?.id,
          title: title.trim() || undefined,
          message: message.trim(),
          urgency,
          filters: target === 'collective' ? { status: statusFilter } : undefined,
        }),
      });

      const data = (await response.json()) as NotificationResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar notificações.');
      }

      setFeedback(`Notificação enviada com sucesso${data.inserted ? ` para ${data.inserted} destinatário(s)` : ''}.`);
      setMessage('');
      setTitle('');
    } catch (err) {
      console.error('Erro ao enviar notificação:', err);
      setFeedback(null);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar notificação.');
    } finally {
      setSending(false);
    }
  }, [message, selectedRecipient, statusFilter, target, title, urgency]);

  const createAlert = useCallback(async () => {
    if (!alertTitle.trim() || !alertMessage.trim()) {
      setError('Informe título e mensagem do alerta.');
      return;
    }

    setCreatingAlert(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: alertTitle.trim(),
          message: alertMessage.trim(),
          severity: alertSeverity,
        }),
      });

      const data = (await response.json()) as NotificationResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao criar alerta.');
      }

      setFeedback('Alerta registrado com sucesso.');
      setAlertTitle('');
      setAlertMessage('');
    } catch (err) {
      console.error('Erro ao criar alerta:', err);
      setFeedback(null);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar alerta.');
    } finally {
      setCreatingAlert(false);
    }
  }, [alertMessage, alertSeverity, alertTitle]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Alertas & Notificações</h2>
        <p className="text-sm text-gray-400">Envie avisos individuais ou coletivos e registre alertas da plataforma.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Envio de notificações</h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="radio"
                  value="individual"
                  checked={target === 'individual'}
                  onChange={() => setTarget('individual')}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                Individual
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="radio"
                  value="collective"
                  checked={target === 'collective'}
                  onChange={() => setTarget('collective')}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                Coletiva
              </label>
            </div>

            {target === 'individual' ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recipientQuery}
                    onChange={(event) => setRecipientQuery(event.target.value)}
                    placeholder="Buscar por e-mail, usuário ou nome"
                    className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={findRecipient}
                    className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                  >
                    Localizar
                  </button>
                </div>
                {selectedRecipient ? (
                  <p className="text-xs text-emerald-300">{selectedRecipient.name || selectedRecipient.username || selectedRecipient.email}</p>
                ) : (
                  <p className="text-xs text-gray-500">Nenhum destinatário selecionado.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Filtrar por status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="pending">Pendentes</option>
                  <option value="">Todos</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Título (opcional)</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Resumo da mensagem"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem</label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="Conteúdo da notificação"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm text-gray-300">
                Urgência:
                <select
                  value={urgency}
                  onChange={(event) => setUrgency(event.target.value as typeof urgency)}
                  className="ml-2 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                </select>
              </label>
              <button
                onClick={sendNotification}
                disabled={sending}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Enviando...' : 'Enviar notificação'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-white mb-4">Registro de alertas</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Título</label>
              <input
                type="text"
                value={alertTitle}
                onChange={(event) => setAlertTitle(event.target.value)}
                placeholder="Título do alerta"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem</label>
              <textarea
                value={alertMessage}
                onChange={(event) => setAlertMessage(event.target.value)}
                rows={4}
                placeholder="Descreva o alerta ou incidente"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm text-gray-300">
                Severidade:
                <select
                  value={alertSeverity}
                  onChange={(event) => setAlertSeverity(event.target.value as typeof alertSeverity)}
                  className="ml-2 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="info">Informativo</option>
                  <option value="warning">Atenção</option>
                  <option value="critical">Crítico</option>
                </select>
              </label>
              <button
                onClick={createAlert}
                disabled={creatingAlert}
                className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingAlert ? 'Registrando...' : 'Registrar alerta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
