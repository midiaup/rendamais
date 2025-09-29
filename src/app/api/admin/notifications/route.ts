import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface NotificationRequest {
  targetType: 'individual' | 'collective';
  message: string;
  title?: string;
  profileId?: string;
  filters?: {
    status?: string;
    is_active?: boolean;
  };
  urgency?: 'low' | 'normal' | 'high';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NotificationRequest;
    const { targetType, message, profileId, filters, title, urgency } = body;

    if (!targetType || !message) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de envio e mensagem são obrigatórios.',
      }, { status: 400 });
    }

    if (targetType === 'individual') {
      if (!profileId) {
        return NextResponse.json({
          success: false,
          error: 'Selecione um usuário para envio individual.',
        }, { status: 400 });
      }

      const payload: Record<string, unknown> = {
        profile_id: profileId,
        message,
      };

      if (title) {
        payload.title = title;
      }
      if (urgency) {
        payload.urgency = urgency;
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .insert(payload);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ success: true, inserted: 1 });
    }

    let query = supabaseAdmin
      .from('profiles')
      .select('id, status, is_active');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (typeof filters?.is_active === 'boolean') {
      query = query.eq('is_active', filters.is_active);
    }

    const { data: profiles, error: profileError } = await query;

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum usuário encontrado para o filtro informado.',
      }, { status: 404 });
    }

    const notifications = profiles.map((profile) => {
      const payload: Record<string, unknown> = {
        profile_id: profile.id,
        message,
      };

      if (title) {
        payload.title = title;
      }
      if (urgency) {
        payload.urgency = urgency;
      }

      return payload;
    });

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, inserted: notifications.length });
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar notificações.',
    }, { status: 500 });
  }
}
