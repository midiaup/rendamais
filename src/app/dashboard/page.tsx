'use client';

import { useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import FunctionTestRunner from '@/components/Admin/FunctionTestRunner';
import AdminTableViewer from '@/components/Admin/AdminTableViewer';
import UserManager from '@/components/Admin/UserManager';
import NotificationCenter from '@/components/Admin/NotificationCenter';
import ChatSupportConsole from '@/components/Admin/ChatSupportConsole';
import PaymentReports from '@/components/Admin/PaymentReports';
import RegistrationOverview from '@/components/Admin/RegistrationOverview';

export default function DashboardPage() {
  const supabase = useMemo<SupabaseClient>(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-sm text-gray-400 max-w-3xl">
            Centralize o acompanhamento das operações da plataforma RENDA MAIS. Consulte tabelas, monitore cadastros, envie
            notificações e administre o suporte em tempo real.
          </p>
        </header>

        <FunctionTestRunner />
        <RegistrationOverview />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <UserManager supabase={supabase} />
          <NotificationCenter supabase={supabase} />
        </div>
        <PaymentReports />
        <ChatSupportConsole />
        <AdminTableViewer supabase={supabase} />
      </div>
    </div>
  );
}
