import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface AlertRequest {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  activeUntil?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AlertRequest;
    const { title, message, severity = 'info', activeUntil } = body;

    if (!title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Título e mensagem são obrigatórios para criar um alerta.',
      }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      title,
      message,
      severity,
      active: true,
    };

    if (activeUntil) {
      payload.active_until = activeUntil;
    }

    const { data, error } = await supabaseAdmin
      .from('alerts')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, alert: data });
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar alerta.',
    }, { status: 500 });
  }
}
